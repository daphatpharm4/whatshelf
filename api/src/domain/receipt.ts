export type Receipt = {
  id: string;
  merchantId: string;
  orderId: string;
  pdfUrl: string;
  sentVia: string[];
  sentAt: string[];
};
