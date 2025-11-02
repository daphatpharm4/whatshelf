# Observability

## KPIs
- North Star: orders/week/shop
- Guardrails: payment success ≥ 96%, STK→receipt p50 < 8s, WhatsApp delivery ≥ 98%

## Tracing & Metrics
- OpenTelemetry in API; correlation ID injected at edge
- Custom metrics:
  - `payments.latency_ms` (intent→webhook)
  - `receipts.latency_ms` (payment→receipt_sent)
  - `webhooks.error_rate`, `queues.depth`

## Dashboards & Alerts
- App Insights Workbook (ops/dashboards/app_insights_workbook.json)
- Alerts:
  - `payment_latency_p95 > 12s for 5m`
  - `webhook_5xx_rate > 2% for 10m`
  - `queue_depth > 5k for 10m`
