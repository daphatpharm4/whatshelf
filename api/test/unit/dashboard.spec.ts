import { describe, expect, it } from 'vitest';
import { computeMerchantMetrics } from '../../src/domain/analytics.js';
import type { Order } from '../../src/domain/order.js';

describe('computeMerchantMetrics', () => {
  const now = new Date('2025-01-31T12:00:00Z');

  it('aggregates revenue buckets and order counts', () => {
    const orders: Order[] = [
      {
        id: 'o1',
        merchantId: 'm1',
        status: 'PAID',
        buyer: { phone: '2547001' },
        totals: { subTotal: 80, tax: 16, grandTotal: 96 },
        items: [
          { productId: 'p1', qty: 2, unitPrice: 40 },
          { productId: 'p2', qty: 1, unitPrice: 16 },
        ],
        createdAt: '2025-01-31T09:00:00Z',
      },
      {
        id: 'o2',
        merchantId: 'm1',
        status: 'COMPLETED',
        buyer: { phone: '2547002' },
        totals: { subTotal: 100, tax: 20, grandTotal: 120 },
        items: [{ productId: 'p1', qty: 1, unitPrice: 100 }],
        createdAt: '2025-01-28T10:00:00Z',
      },
      {
        id: 'o3',
        merchantId: 'm1',
        status: 'PENDING_PAYMENT',
        buyer: { phone: '2547001' },
        totals: { subTotal: 30, tax: 6, grandTotal: 36 },
        items: [{ productId: 'p3', qty: 3, unitPrice: 10 }],
        createdAt: '2025-01-27T07:00:00Z',
      },
      {
        id: 'o4',
        merchantId: 'm1',
        status: 'CANCELLED',
        buyer: { phone: '2547003' },
        totals: { subTotal: 50, tax: 10, grandTotal: 60 },
        items: [{ productId: 'p4', qty: 1, unitPrice: 50 }],
        createdAt: '2024-12-15T08:00:00Z',
      },
    ];

    const metrics = computeMerchantMetrics(orders, now);

    expect(metrics.revenue).toEqual({ today: 96, week: 216, month: 216, total: 216 });
    expect(metrics.orders).toEqual({ total: 4, paid: 2, pending: 1, cancelled: 1, refunded: 0 });
    expect(metrics.averageOrderValue).toBeCloseTo(108);
    expect(metrics.repeatCustomerRate).toBeCloseTo(0.33, 2);
    expect(metrics.topProducts[0]).toEqual({ productId: 'p1', quantity: 3, revenue: 180 });
  });

  it('handles empty orders gracefully', () => {
    const metrics = computeMerchantMetrics([], now);

    expect(metrics.revenue.total).toBe(0);
    expect(metrics.orders.total).toBe(0);
    expect(metrics.averageOrderValue).toBe(0);
    expect(metrics.repeatCustomerRate).toBe(0);
    expect(metrics.topProducts).toEqual([]);
  });
});
