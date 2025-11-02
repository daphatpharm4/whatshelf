import { app, type InvocationContext } from '@azure/functions';
import { containers } from '../lib/db.js';
import { withCtx } from '../lib/logger.js';
import { uploadPdf } from '../lib/storage.js';
import { sendWhatsApp } from '../adapters/whatsapp/send.js';

app.storageQueue('receiptWorker', {
  queueName: 'jobs',
  connection: 'QUEUE_CONN',
  handler: async (message: unknown, ctx: InvocationContext) => {
    const body =
      typeof message === 'string'
        ? JSON.parse(Buffer.from(message, 'base64').toString())
        : message;
    if (!body || (body as any).type !== 'RECEIPT_REQUESTED') {
      return;
    }

    const { merchantId, orderId } = (body as any).payload ?? {};
    const log = withCtx(ctx.invocationId);
    const { resource: order } = await containers.orders.item(orderId, merchantId).read<any>();
    if (!order) {
      log.warn({ event: 'RECEIPT_WORKER_SKIP', reason: 'ORDER_MISSING', orderId });
      return;
    }

    const pdf = await renderReceiptPdf(order);
    const pdfUrl = await uploadPdf(pdf, `receipts/${merchantId}/${orderId}.pdf`);
    await containers.receipts.items.create(
      {
        id: `r_${orderId}`,
        merchantId,
        orderId,
        pdfUrl,
        sentVia: [],
        sentAt: [],
      },
      { partitionKey: merchantId },
    );

    await sendWhatsApp(order.buyer.phone, `Payment received. Receipt: ${pdfUrl}`);
    await containers.receipts.item(`r_${orderId}`, merchantId).patch([
      { op: 'add', path: '/sentVia/-', value: 'WHATSAPP' },
      { op: 'add', path: '/sentAt/-', value: new Date().toISOString() },
    ]);

    log.info({ event: 'RECEIPT_SENT', orderId, pdfUrl });
  },
});

async function renderReceiptPdf(order: any): Promise<Buffer> {
  const content = `RECEIPT
Order ${order.id}
Amount ${order.totals?.grandTotal}
`;
  return Buffer.from(content, 'utf8');
}
