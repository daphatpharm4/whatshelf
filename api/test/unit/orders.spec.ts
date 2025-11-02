import { describe, expect, it, vi, beforeEach } from 'vitest';

const httpMock = vi.fn();

vi.mock('@azure/functions', () => ({
  app: { http: httpMock },
}));

const readById = vi.fn();

vi.mock('../../src/lib/db.js', () => ({
  readById,
  upsert: vi.fn(),
}));

vi.mock('../../src/lib/logger.js', () => ({
  withCtx: () => ({ info: vi.fn() }),
}));

vi.mock('../../src/lib/queue.js', () => ({
  enqueue: vi.fn(),
}));

describe('postPay route', () => {
  beforeEach(() => {
    readById.mockReset();
    httpMock.mockClear();
  });

  it('returns a 404 problem when the order is missing', async () => {
    readById.mockResolvedValue({ resource: undefined });
    const { postPayHandler } = await import('../../src/routes/orders.js');

    const headersValues: Record<string, string> = {
      'x-correlation-id': 'corr-123',
      'x-merchant-id': 'm_001',
    };

    const headers = {
      get: (name: string) => headersValues[name.toLowerCase()] ?? null,
      ...headersValues,
    } as any;

    const req = {
      params: { id: 'order-123' },
      headers,
      json: vi.fn().mockResolvedValue({ method: 'MPESA', phone: '254700000000' }),
    } as any;

    const ctx = { log: { error: vi.fn() } } as any;

    const res = await postPayHandler(req, ctx);

    expect(res.status).toBe(404);
    expect(res.headers).toMatchObject({ 'x-correlation-id': 'corr-123' });
    expect(res.jsonBody).toMatchObject({
      type: 'https://errors.whatshelf.app/NOT_FOUND',
      title: 'Order not found',
      code: 'NOT_FOUND',
    });
  });
});
