# Data Model (Cosmos DB, partition key: merchantId)

## merchants
```json
{
  "id": "m_001",
  "merchantId": "m_001",
  "displayName": "Dorcas Styles",
  "phone": "+2547...",
  "currency": "KES",
  "timeZone": "Africa/Nairobi",
  "mPesa": {"shortcode": "123456", "callbackUrl": "..."},
  "plan": {"tier": "starter", "status": "active"},
  "settings": {"taxInclusive": true, "language": "en"}
}
```

## products
```json
{
  "id": "p_001",
  "merchantId": "m_001",
  "title": "Midi Dress",
  "price": 2400,
  "stock": {"type": "finite", "quantity": 12},
  "media": [{"url": "https://cdn/...", "thumbUrl": "https://cdn/t/..."}],
  "visibility": "public"
}
```

## carts (TTL: 72h)
```json
{
  "id": "c_001",
  "merchantId": "m_001",
  "buyer": {"phone": "+2547...", "name": "Anne"},
  "items": [{"productId": "p_001", "qty": 2, "unitPrice": 2400}],
  "totals": {"subTotal": 4800, "tax": 0, "grandTotal": 4800}
}
```

## orders
```json
{
  "id": "o_001",
  "merchantId": "m_001",
  "orderNo": "202511-0001",
  "status": "PAID",
  "buyer": {"phone": "+2547...", "name": "Anne"},
  "items": [{"productId": "p_001", "qty": 2, "unitPrice": 2400}],
  "totals": {"subTotal": 4800, "tax": 0, "grandTotal": 4800},
  "payment": {"method": "MPESA", "status": "SUCCESS", "txnId": "LKJ234..."},
  "fulfilment": {"mode": "PICKUP"}
}
```

## payments (append-only)
```json
{
  "id": "pay_001",
  "merchantId": "m_001",
  "orderId": "o_001",
  "provider": "MPESA",
  "intentId": "pi_001",
  "amount": 4800,
  "status": "SUCCESS",
  "direction": "C2B",
  "idempotencyKey": "m_001:o_001:pi_001"
}
```

## receipts
```json
{
  "id": "r_001",
  "merchantId": "m_001",
  "orderId": "o_001",
  "pdfUrl": "https://blob/receipts/r_001.pdf",
  "sentVia": ["WHATSAPP"],
  "sentAt": ["2025-11-02T13:05:24Z"]
}
```

## events (audit/analytics)
```json
{
  "id": "e_001",
  "merchantId": "m_001",
  "type": "PAYMENT_RECEIVED",
  "actor": "SYSTEM",
  "correlationId": "o_001",
  "payload": {"txnId": "LKJ234...", "amount": 4800}
}
```
