import { randomUUID } from 'node:crypto';
import { idempoKey } from '../../domain/payment.js';

type StkPushInput = {
  phone: string;
  amount: number;
  reference: string;
  merchantId: string;
};

type StkPushResponse = {
  intentId: string;
  idempotencyKey: string;
};

export async function stkPush({ phone, amount, reference, merchantId }: StkPushInput): Promise<StkPushResponse> {
  // In production this function should exchange credentials for an access token and
  // issue a real STK push request against M-Pesa. For the MVP we return a deterministic
  // identifier so downstream components can proceed end-to-end.
  void phone;
  void amount;

  const intentId = randomUUID();
  const providerRef = `CHK-${intentId}`;
  const key = idempoKey(merchantId, reference, 'MPESA', providerRef);

  return { intentId: providerRef, idempotencyKey: key };
}
