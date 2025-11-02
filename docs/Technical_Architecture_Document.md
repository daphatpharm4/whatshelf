
---

## docs/Technical_Architecture_Document.md (author: CA)

```md
# Technical Architecture Document (TAD)

## 1. Scope & Goals
Deliver a minimal-yet-robust commerce layer for WhatsApp-first SMBs:
- Catalog → Checkout → Payment → Receipt; offline-ready, data-light.
- Kenya-first rails (M-Pesa) with adapter pattern for future providers.

## 2. Constraints & Assumptions
- Serverless-first to reduce ops toil.
- No card data handled (PCI out-of-scope).
- Multi-tenant by design with `merchantId` partitioning.

## 3. Component Model
- **PWA**: React/Vite; IndexedDB caching; i18n (en/sw).
- **API**: Azure Functions (Node 20, TypeScript); HTTP + QueueTriggers.
- **Adapters**: `PaymentProvider` (M-Pesa) and `MessagingProvider` (WhatsApp/SMS).
- **Workers**: receipt generation, abandoned-cart reminders.

## 4. Data Model Summary
Collections: merchants, products, categories, carts (TTL), orders, payments (event log), receipts, events (audit). See `docs/DataModel.md`.

## 5. API Surface
REST v1 with JWT (merchant) and signed links (buyer). See `docs/API.md`.

## 6. Security
- JWT (RS256) for console; short-lived buyer links signed with HMAC.
- Secret storage: Key Vault; rotation quarterly.
- Webhook signature validation; strict idempotency keys.
- PII minimization; access logs with correlation IDs; no sensitive data in logs.

## 7. Observability
- OpenTelemetry traces; App Insights dashboards.
- KPIs: orders/week/shop, payment success rate, end-to-end latency.

## 8. Availability & DR
- Active/active Functions; queue-backed retry; DLQ inspection runbook.
- Daily backups; PITR on Cosmos; Blob lifecycle rules (hot→cool after 90d).

## 9. Capacity & Cost
- Cosmos RU throttles per partition; start 10K RU/s shared; autoscale.
- Functions consumption plan; CDN for static/PWA; dev/staging small SKU.

## 10. Risks & Mitigations
- Provider outages → circuit breakers + backoff + DLQ.
- Template rejections → pre-approved minimal templates + SMS fallback.
- High churn micro-merchants → activation playbooks, reseller channel.

## 11. Roadmap (Months 1–6)
- Sprints 0–4: MVP; Pilots A/B; refunds, coupons, analytics, onboarding.
- Month 4–6: delivery handoff webhooks, staff roles, payout ledger, billing.

## 12. Compliance
- Platform T&Cs, Privacy Policy; opt-in messaging practices; data residency within nearest compliant region.

