# Architecture Overview

## Context (C4 Level 1)
```mermaid
flowchart LR
  Customer -- PWA/WhatsApp --> Frontend["PWA (CDN) + WhatsApp Bot"]
  Frontend -- HTTPS --> API["Azure Functions API"]
  API -- Queries --> Cosmos[(Cosmos DB)]
  API -- Media --> Blob[(Blob Storage + CDN)]
  API -- Send/Recv --> WA["WhatsApp Cloud API"]
  API -- STK Push/Webhook --> Mpesa["M-Pesa Daraja"]
  API -- Events --> Queue["Azure Storage Queue + DLQ"]
  API -- Traces/Metrics --> APM["App Insights + Log Analytics"]


Key NFRs

Latency: STK→Receipt p50 < 8s, p95 < 12s
Availability: API 99.9% monthly; webhook handling with retries & DLQ
Scalability: ≥ 50 TPS burst on payment callbacks
Security: PII-minimal; all secrets in Key Vault; signed buyer links; OTP for merchants


High-level Data Flow 

Buyer creates order via PWA or WhatsApp.
Merchant triggers STK push; API records PaymentIntent.
M-Pesa webhook confirms payment; API marks order PAID.
Receipt worker generates PDF, stores in Blob, sends via WhatsApp/SMS.