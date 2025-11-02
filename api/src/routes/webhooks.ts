import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { MpesaCallbackSchema } from '../validation/schemas.js';
import { validate } from '../lib/validate.js';
import { containers, readById, upsert } from '../lib/db.js';
import { Errors, toProblem } from '../lib/errors.js';
import { withCtx } from '../lib/logger.js';
import { correlationId } from '../lib/context.js';
import { idempoKey } from '../domain/payment.js';
import { applyPaymentSuccess } from '../domain/order.js';
import { enqueue } from '../lib/queue.js';

app.http('mpesaWebhook', {
  methods: ['POST'],
  route: 'v1/webhooks/mpesa',
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const corr = correlationId(req.headers as any);
    const log = withCtx(corr);
    try {
      const raw = await req.json();
      const data = validate(MpesaCallbackSchema, raw);
      const callback = data.Body.stkCallback;
      const ok = callback.ResultCode === 0;
      const checkout = callback.CheckoutRequestID;
      const amount = extractAmount(data);
      const { orderId, merchantId } = await mapCheckoutToOrder(checkout);
      const key = idempoKey(merchantId, orderId, 'MPESA', checkout);

      try {
        await containers.idempo.items.create(
          { id: key, merchantId, createdAt: new Date().toISOString() },
          { partitionKey: merchantId },
        );
      } catch (error: any) {
        if (error?.code === 409) {
          throw Errors.Idempotent();
        }
        throw error;
      }

      await upsert(
        'payments',
        {
          id: checkout,
          merchantId,
          orderId,
          provider: 'MPESA',
          amount,
          status: ok ? 'SUCCESS' : 'FAILED',
          direction: 'C2B',
          idempotencyKey: key,
          updatedAt: new Date().toISOString(),
        },
        merchantId,
      );

      const { resource: order } = await readById('orders', orderId, merchantId);
      if (!order) {
        throw Errors.NotFound('Order not found');
      }

      const updated = ok ? applyPaymentSuccess(order, { txnId: checkout }) : order;
      await upsert('orders', updated, merchantId);

      if (ok) {
        await enqueue('RECEIPT_REQUESTED', { merchantId, orderId });
      }

      log.info({ event: 'MPESA_WEBHOOK_OK', orderId, checkout, amount, ok });
      return { status: 200, jsonBody: { ok: true }, headers: { 'x-correlation-id': corr } };
    } catch (error) {
      const [status, problem] = toProblem(error, corr);
      ctx.log.error(error as Error);
      return { status, jsonBody: problem, headers: { 'x-correlation-id': corr } };
    }
  },
});

function extractAmount(data: unknown): number {
  const item =
    (data as any).Body?.stkCallback?.CallbackMetadata?.Item?.find((entry: any) => entry.Name === 'Amount');
  return Number(item?.Value ?? 0);
}

async function mapCheckoutToOrder(checkoutId: string): Promise<{ orderId: string; merchantId: string }> {
  return { orderId: checkoutId.split('-')[0], merchantId: 'm_001' };
}
