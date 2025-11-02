# Runbooks

## 1) Webhook Storm
Symptoms: high 5xx on /webhooks/mpesa, queue depth rising.
Steps:
1. Enable slow-consumer mode (ENV: WORKER_CONCURRENCY=2).
2. Verify signature failures vs provider outage.
3. Drain DLQ with `scripts/dlq-drain.ts` after root cause fix.
RTO target: 30m.

## 2) Payments Lag
Symptoms: STK success reported by users, orders stuck PENDING_PAYMENT.
Steps:
1. Check provider status; compare inbound webhook count vs intents.
2. Reconcile using `payments` event log; replay missing intents by idempotency key.
3. Notify affected merchants via WhatsApp template; post-mortem within 24h.

## 3) Hot Merchant Throttle
Symptoms: one merchant saturates RUs/queues.
Steps:
1. Apply merchant-level rate limits (429 policy); raise RU burst temporarily.
2. Message merchant with guidance; propose Pro plan upgrade.
3. Review after 24h; tune quotas.
