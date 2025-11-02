export type Order = {
  id: string;
  merchantId: string;
  status:
    | 'PENDING_PAYMENT'
    | 'PAID'
    | 'FULFILLING'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'REFUNDED';
  buyer: { phone: string; name?: string };
  items: { productId: string; qty: number; unitPrice: number }[];
  totals: { subTotal: number; tax: number; grandTotal: number };
  payment?: {
    method: 'MPESA' | 'CASH';
    status?: 'PENDING' | 'SUCCESS' | 'FAILED';
    txnId?: string;
    referenceCode?: string;
  };
};

export const applyPaymentSuccess = (order: Order, event: { txnId: string }): Order => ({
  ...order,
  status: 'PAID',
  payment: {
    ...order.payment,
    method: order.payment?.method ?? 'MPESA',
    status: 'SUCCESS',
    txnId: event.txnId,
  },
});
