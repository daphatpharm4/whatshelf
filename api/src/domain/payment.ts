export type PaymentEvent = {
  intentId: string;
  amount: number;
  txnId: string;
  status: 'SUCCESS' | 'FAILED';
  idempotencyKey: string;
  provider: 'MPESA';
  payerPhone?: string;
  ts: number;
};

export const idempoKey = (
  merchantId: string,
  orderId: string,
  provider: string,
  intentId: string,
) => `${merchantId}:${orderId}:${provider}:${intentId}`;
