# Security

- **Auth**
  - Merchant: JWT (RS256), refresh tokens 24h, sessions 15m idle timeout.
  - Buyer: short-lived signed links (HMAC) scoped to `orderId`, 15m TTL.

- **Secrets**
  - Stored in Key Vault; rotated quarterly via `scripts/rotate-secrets.ts`.
  - Local dev uses `.env` only with sandbox creds.

- **Webhooks**
  - Validate Daraja and WhatsApp signatures; reject mismatches with 401.
  - Idempotency via `idempotencyKey`; dedupe window 24h.

- **PII**
  - Collect phone and optional name/email; no addresses unless delivery.
  - Redact PII in logs; correlation IDs for all requests.

- **Transport & Storage**
  - HTTPS everywhere; TLS 1.2+.
  - Cosmos with customer-managed keys optional in prod.

- **Abuse & Rate Limits**
  - 60 req/min per IP default; per-merchant quotas adjustable.
  - WAF on CDN; bot detection on public endpoints.

- **Backup/Recovery**
  - Cosmos PITR; Blob lifecycle to cool after 90 days; tested quarterly.

- **Compliance posture**
  - PCI out-of-scope; follows WhatsApp/M-Pesa T&Cs; records consent for messaging templates.
