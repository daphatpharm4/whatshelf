# WhatsShelf — Turn any WhatsApp into a shop in 60 seconds

**WhatsShelf** is a data-light PWA and WhatsApp bot that lets micro-merchants publish a catalog, accept M-Pesa payments (STK/QR), and issue smart receipts instantly.

## Features
- Catalog from phone gallery; QR codes per shop/item
- Checkout via PWA or WhatsApp; STK push & QR
- Branded e-receipts (WhatsApp/SMS/email PDF)
- Order timeline; low-stock alerts; basic analytics
- Offline-first browsing and draft orders

## Architecture
- Frontend: React + Vite PWA (IndexedDB offline cache)
- API: Azure Functions (HTTP + Queue triggers)
- Data: Azure Cosmos DB (NoSQL, partition by merchantId)
- Storage: Azure Blob + CDN
- Messaging: WhatsApp Cloud API, SMS fallback
- Payments: M-Pesa Daraja (STK Push, C2B/QR)
- Observability: App Insights + Log Analytics
- IaC: Terraform; CI/CD: GitHub Actions

## Quick start
```bash
pnpm i
pnpm -w run bootstrap  # installs frontend and api
cp .env.example .env   # fill secrets
pnpm -w run dev        # runs functions + PWA with local emulators
Environments
dev (shared sandbox), staging (pre-prod), prod
Secrets in Azure Key Vault; never commit .env with real values
Documentation
High-level: docs/Architecture.md
API spec: docs/API.md
Data model: docs/DataModel.md
Security: docs/Security.md
Runbooks: docs/Runbooks.md
Technical Arch: docs/Technical_Architecture_Document.md
License
Proprietary — All rights reserved.

---

## .env.example (author: SE)

```env
# General
NODE_ENV=development
TZ=Africa/Nairobi

# API
API_BASE_URL=http://localhost:7071
JWT_ISSUER=whatshelf
JWT_AUDIENCE=merchant-console
JWT_SIGNING_KEY=local-dev-only-change

# Azure (local emulators via Azurite/Cosmos Emulator)
AZURE_STORAGE_CONNECTION_STRING=UseDevelopmentStorage=true
COSMOS_ENDPOINT=https://localhost:8081
COSMOS_KEY=C2oF...==   # emulator key
COSMOS_DB_NAME=whatshelf

# WhatsApp Cloud API
WA_BASE_URL=https://graph.facebook.com/v18.0
WA_PHONE_NUMBER_ID=
WA_BUSINESS_ACCOUNT_ID=
WA_ACCESS_TOKEN=

# M-Pesa Daraja (sandbox)
MPESA_BASE_URL=https://sandbox.safaricom.co.ke
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=https://<tunnel-or-staging>/v1/webhooks/mpesa

# Email/SMS
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
SMS_API_KEY=

# PDF/Receipts
RECEIPT_BRAND_NAME=WhatsShelf
RECEIPT_FROM_EMAIL=noreply@whatshelf.app

# Observability
APPINSIGHTS_CONNECTION_STRING=