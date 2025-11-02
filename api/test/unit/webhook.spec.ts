import { describe, expect, it } from 'vitest';
import { idempoKey } from '../../src/domain/payment.js';

describe('idempotency key', () => {
  it('stable composition', () => {
    const key = idempoKey('m', 'o', 'MPESA', 'chk');
    expect(key).toBe('m:o:MPESA:chk');
  });
});
