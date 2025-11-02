import { setTimeout as delay } from 'node:timers/promises';
import process from 'node:process';
import { CosmosClient } from '@azure/cosmos';
import { BlobServiceClient } from '@azure/storage-blob';
import { fetch } from 'undici';

type CliOptions = {
  merchantId: string;
  orderId: string;
  phone: string;
  amount: number;
};

type PaymentResponse = {
  paymentIntentId: string;
  status: string;
};

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const parseArgs = (): CliOptions => {
  const args = process.argv.slice(2);
  const options: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    if (!key || !value || !key.startsWith('--')) {
      throw new Error('Arguments must be provided as --key value pairs');
    }
    options[key.slice(2)] = value;
  }

  const merchantId = options['merchant'];
  const orderId = options['order'];
  const phone = options['phone'];
  const amount = Number(options['amount'] ?? '1200');

  if (!merchantId || !orderId || !phone || Number.isNaN(amount)) {
    throw new Error('Usage: ts-node e2e-happy-path.ts --merchant <id> --order <id> --phone <msisdn> [--amount <number>]');
  }

  return { merchantId, orderId, phone, amount };
};

const buildWebhookPayload = (checkoutId: string, amount: number, phone: string) => ({
  Body: {
    stkCallback: {
      MerchantRequestID: `MERCHANT-${checkoutId}`,
      CheckoutRequestID: checkoutId,
      ResultCode: 0,
      ResultDesc: 'The service request is processed successfully.',
      CallbackMetadata: {
        Item: [
          { Name: 'Amount', Value: amount },
          { Name: 'MpesaReceiptNumber', Value: `R-${checkoutId.slice(0, 8)}` },
          { Name: 'PhoneNumber', Value: phone },
        ],
      },
    },
  },
});

async function main() {
  const { merchantId, orderId, phone, amount } = parseArgs();

  const cosmosEndpoint = requireEnv('COSMOS_ENDPOINT');
  const cosmosKey = requireEnv('COSMOS_KEY');
  const cosmosDbName = process.env.COSMOS_DB ?? 'whatshelf';
  const blobConnection = requireEnv('BLOB_CONN');
  const apiBase = process.env.API_BASE ?? 'http://localhost:7071/api';

  const cosmos = new CosmosClient({ endpoint: cosmosEndpoint, key: cosmosKey });
  const database = cosmos.database(cosmosDbName);
  const products = database.container('products');
  const orders = database.container('orders');
  const receipts = database.container('receipts');

  const now = new Date().toISOString();
  const productId = `p_${orderId}`;
  const product = {
    id: productId,
    merchantId,
    name: 'Demo product',
    price: amount,
    createdAt: now,
  };
  await products.items.upsert(product, { partitionKey: merchantId });

  const orderDocument = {
    id: orderId,
    merchantId,
    status: 'PENDING_PAYMENT',
    buyer: { phone },
    items: [{ productId, qty: 1, unitPrice: amount }],
    totals: { subTotal: amount, tax: 0, grandTotal: amount },
    payment: { method: 'MPESA', status: 'PENDING' },
    createdAt: now,
    updatedAt: now,
  };
  await orders.items.upsert(orderDocument, { partitionKey: merchantId });

  const payResponse = await fetch(`${apiBase}/v1/orders/${orderId}/pay`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-merchant-id': merchantId,
    },
    body: JSON.stringify({ method: 'MPESA', phone }),
  });

  if (!payResponse.ok) {
    throw new Error(`Payment intent failed: ${payResponse.status} ${await payResponse.text()}`);
  }

  const intent = (await payResponse.json()) as PaymentResponse;
  if (!intent.paymentIntentId) {
    throw new Error('API did not return a paymentIntentId');
  }

  console.info('Checkout ID:', intent.paymentIntentId);

  const webhookResponse = await fetch(`${apiBase}/v1/webhooks/mpesa`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(buildWebhookPayload(intent.paymentIntentId, amount, phone)),
  });

  if (!webhookResponse.ok) {
    throw new Error(`Webhook failed: ${webhookResponse.status} ${await webhookResponse.text()}`);
  }

  console.info('Webhook accepted, waiting for receipt worker…');

  let orderStatus = 'PENDING_PAYMENT';
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const { resource } = await orders.item(orderId, merchantId).read<any>();
    orderStatus = resource?.status ?? orderStatus;
    if (orderStatus === 'PAID') {
      break;
    }
    await delay(1_000);
  }

  if (orderStatus !== 'PAID') {
    throw new Error(`Order did not reach PAID status (current: ${orderStatus})`);
  }

  console.info('Order marked as PAID, verifying receipt document…');

  let receiptFound = false;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      const { resource } = await receipts.item(`r_${orderId}`, merchantId).read<any>();
      if (resource?.pdfUrl) {
        receiptFound = true;
        break;
      }
    } catch (error: any) {
      if (error.code !== 404) {
        throw error;
      }
    }
    await delay(1_000);
  }

  if (!receiptFound) {
    throw new Error('Receipt record not created');
  }

  const blobService = BlobServiceClient.fromConnectionString(blobConnection);
  const container = blobService.getContainerClient('public');
  const blob = container.getBlockBlobClient(`receipts/${merchantId}/${orderId}.pdf`);
  if (!(await blob.exists())) {
    throw new Error('Receipt PDF blob not found');
  }

  console.info('Receipt PDF present. Happy path completed successfully.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

