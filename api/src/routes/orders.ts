import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { validate } from '../lib/validate.js';
import { PaySchema } from '../validation/schemas.js';
import { readById, upsert } from '../lib/db.js';
import { Errors, toProblem } from '../lib/errors.js';
import { withCtx } from '../lib/logger.js';
import { correlationId } from '../lib/context.js';

app.http('postPay', {
  methods: ['POST'],
  route: 'v1/orders/{id}/pay',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const corr = correlationId(req.headers as any);
    const log = withCtx(corr);
    try {
      const { id } = req.params;
      const merchantId = req.headers.get('x-merchant-id');
      if (!merchantId) {
        throw Errors.Forbidden('Missing merchant context');
      }

      const body = await req.json();
      const input = validate(PaySchema, body);
      const { resource: order } = await readById('orders', id, merchantId);
      if (!order) {
        throw Errors.NotFound('Order not found');
      }

      const intent = await import('../adapters/mpesa/stkPush.js').then((mod) =>
        mod.stkPush({
          phone: input.phone,
          amount: order.totals.grandTotal,
          reference: id,
          merchantId,
        }),
      );

      await upsert(
        'payments',
        {
          id: intent.intentId,
          merchantId,
          orderId: id,
          provider: 'MPESA',
          amount: order.totals.grandTotal,
          status: 'PENDING',
          direction: 'C2B',
          idempotencyKey: intent.idempotencyKey,
          createdAt: new Date().toISOString(),
        },
        merchantId,
      );

      log.info({ event: 'PAYMENT_INTENT_CREATED', orderId: id, merchantId });
      return {
        status: 200,
        jsonBody: { paymentIntentId: intent.intentId, status: 'PENDING' },
        headers: { 'x-correlation-id': corr },
      };
    } catch (error) {
      const [status, problem] = toProblem(error, corr);
      ctx.log.error(error as Error);
      return { status, jsonBody: problem, headers: { 'x-correlation-id': corr } };
    }
  },
});
