import { randomUUID } from 'node:crypto';
import { idempoKey } from '../../domain/payment.js';

export async function stkPush(args: { phone: string; amount: number; reference: string }) {
  const intentId = randomUUID();
  const providerRef = `CHK-${intentId}`;
  const key = idempoKey('m_001', args.reference, 'MPESA', providerRef);
  return { intentId: providerRef, idempotencyKey: key };
}
