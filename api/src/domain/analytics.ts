import type { Order } from './order.js';

type RevenueBucket = {
  today: number;
  week: number;
  month: number;
  total: number;
};

type OrderCounts = {
  total: number;
  paid: number;
  pending: number;
  cancelled: number;
  refunded: number;
};

export type TopProduct = {
  productId: string;
  quantity: number;
  revenue: number;
};

export type MerchantMetrics = {
  revenue: RevenueBucket;
  orders: OrderCounts;
  repeatCustomerRate: number;
  averageOrderValue: number;
  topProducts: TopProduct[];
};

const MS_IN_DAY = 1000 * 60 * 60 * 24;

const normalizeDate = (value?: string): Date => {
  if (!value) {
    return new Date(0);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(0);
  }
  return parsed;
};

const isWithinDays = (input: Date, now: Date, days: number): boolean => {
  const diff = now.getTime() - input.getTime();
  return diff >= 0 && diff <= days * MS_IN_DAY;
};

const isSameDay = (input: Date, now: Date): boolean => {
  return (
    input.getUTCFullYear() === now.getUTCFullYear() &&
    input.getUTCMonth() === now.getUTCMonth() &&
    input.getUTCDate() === now.getUTCDate()
  );
};

export const computeMerchantMetrics = (orders: Order[], now = new Date()): MerchantMetrics => {
  let revenueToday = 0;
  let revenueWeek = 0;
  let revenueMonth = 0;
  let revenueTotal = 0;

  let totalOrders = 0;
  let paidOrders = 0;
  let pendingOrders = 0;
  let cancelledOrders = 0;
  let refundedOrders = 0;

  const totalsByBuyer = new Map<string, number>();
  const productAggregation = new Map<string, { quantity: number; revenue: number }>();

  for (const order of orders) {
    totalOrders += 1;
    const createdAt = normalizeDate(order.createdAt ?? order.updatedAt);
    const revenue = order.totals?.grandTotal ?? 0;

    const isRevenueOrder = ['PAID', 'FULFILLING', 'COMPLETED'].includes(order.status);
    if (isRevenueOrder) {
      revenueTotal += revenue;
      if (isSameDay(createdAt, now)) {
        revenueToday += revenue;
      }
      if (isWithinDays(createdAt, now, 7)) {
        revenueWeek += revenue;
      }
      if (isWithinDays(createdAt, now, 30)) {
        revenueMonth += revenue;
      }
      paidOrders += 1;
    }

    if (order.status === 'PENDING_PAYMENT' || order.status === 'FULFILLING') {
      pendingOrders += 1;
    }

    if (order.status === 'CANCELLED') {
      cancelledOrders += 1;
    } else if (order.status === 'REFUNDED') {
      refundedOrders += 1;
    }

    if (order.buyer?.phone) {
      totalsByBuyer.set(order.buyer.phone, (totalsByBuyer.get(order.buyer.phone) ?? 0) + 1);
    }

    for (const item of order.items ?? []) {
      const current = productAggregation.get(item.productId) ?? { quantity: 0, revenue: 0 };
      current.quantity += item.qty;
      current.revenue += item.qty * item.unitPrice;
      productAggregation.set(item.productId, current);
    }
  }

  const repeatCustomers = Array.from(totalsByBuyer.values()).filter((count) => count > 1).length;
  const baseRate = totalsByBuyer.size === 0 ? 0 : repeatCustomers / totalsByBuyer.size;
  const repeatCustomerRate = totalOrders === 0 ? 0 : baseRate;
  const averageOrderValue = paidOrders === 0 ? 0 : revenueTotal / paidOrders;

  const topProducts: TopProduct[] = Array.from(productAggregation.entries())
    .map(([productId, value]) => ({ productId, quantity: value.quantity, revenue: value.revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    revenue: {
      today: roundCurrency(revenueToday),
      week: roundCurrency(revenueWeek),
      month: roundCurrency(revenueMonth),
      total: roundCurrency(revenueTotal),
    },
    orders: {
      total: totalOrders,
      paid: paidOrders,
      pending: pendingOrders,
      cancelled: cancelledOrders,
      refunded: refundedOrders,
    },
    repeatCustomerRate: Number(repeatCustomerRate.toFixed(2)),
    averageOrderValue: roundCurrency(averageOrderValue),
    topProducts,
  };
};

const roundCurrency = (value: number): number => {
  return Math.round(value * 100) / 100;
};
