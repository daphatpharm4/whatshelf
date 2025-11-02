
## docs/API.md (author: SE)

```md
# API v1 (HTTP+JSON)

Base: `/v1` — Auth via JWT (merchant) or signed buyer links.

## Catalog
- `POST /products` → 201 `{product}`
- `GET /products?search&categoryId&visibility` → `{items, next}`
- `PATCH /products/{id}` → `{product}`
- `POST /categories` / `GET /categories`

## Checkout & Orders
- `POST /carts` `{buyer?, items[]}` → `{cart}`
- `POST /carts/{id}/checkout` → `{order}`
- `GET /orders/{id}` → `{order}`
- `POST /orders/{id}/pay` `{method:'MPESA', phone}` → `{paymentIntentId, status}`

## Receipts
- `POST /orders/{id}/receipt` → `{receipt}`
- `GET /receipts/{id}` → `{receipt}` (signed URL)

## Dashboard
- `GET /dashboard/today` → sales, orders, top items
- `GET /settlements` → payout ledger

## Webhooks
- `POST /webhooks/mpesa` — Daraja callback (idempotent)
- `POST /webhooks/whatsapp` — inbound+status updates

## Errors
Problem+JSON:
```json
{"type":"https://errors.whatshelf.app/validation","title":"Invalid input","detail":"price must be >= 0","correlationId":"..."}
OpenAPI (excerpt)
openapi: 3.0.3
info:
  title: WhatsShelf API
  version: 1.0.0
paths:
  /v1/products:
    post:
      summary: Create product
      responses: { "201": { "description": "Created" } }
  /v1/orders/{id}/pay:
    post:
      summary: Trigger M-Pesa STK push
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties: { method: {enum: [MPESA]}, phone: {type: string} }
      responses: { "200": { "description": "Intent accepted" } }