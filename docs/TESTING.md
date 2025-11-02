# WhatsShelf MVP Testing Guide

This document outlines how to exercise every part of the WhatsShelf MVP from a
fresh checkout all the way through end-to-end verification. The steps assume
you are using Node.js 20+, have `pnpm` installed, and have access to the Azure
emulators described in the project README.

## 1. Workspace bootstrap

```bash
pnpm install
```

Running `pnpm install` at the repository root wires up the workspace, installs
Azure Functions tooling for the API, and prepares the frontend build scripts.

## 2. Static analysis and type safety

```bash
pnpm lint        # ESLint across API + frontend
pnpm typecheck   # Strict TypeScript compilation for every package
```

Both commands must pass without warnings before shipping. They protect against
syntax errors, missing imports, and unsafe TypeScript coercions that would
otherwise surface at runtime.

## 3. Unit tests

```bash
pnpm test
```

This runs all Vitest suites. Start by extending coverage in
`api/test/unit` and `frontend/src` as you implement new behaviours. When a bug
is reported, reproduce it with a unit test before fixing the implementation.

## 4. Local infrastructure emulators

1. Start [Azurite](https://learn.microsoft.com/azure/storage/common/storage-use-azurite) for Blob/Queue storage.
2. Run the [Cosmos DB emulator](https://learn.microsoft.com/azure/cosmos-db/local-emulator) (Docker image available).
3. Ensure the connection strings in `.env` match the emulator endpoints and
   populate them via `cp .env.example .env`.

## 5. Azure Functions API

```bash
cd api
pnpm build          # optional, exercises the TypeScript compiler
pnpm func start     # or: pnpm dev (which proxies to the Functions host)
```

With the host running you can hit each route:

* **Create product:**

  ```bash
  curl -X POST http://localhost:7071/api/v1/products \
    -H "content-type: application/json" \
    -H "x-merchant-id: m_001" \
    -d '{"name":"Demo","price":1200}'
  ```

* **Trigger payment intent:** First seed an order document in Cosmos DB (see
  `scripts/seed-dev.ts`). Then call:

  ```bash
  curl -X POST http://localhost:7071/api/v1/orders/<ORDER_ID>/pay \
    -H "content-type: application/json" \
    -H "x-merchant-id: m_001" \
    -d '{"method":"MPESA","phone":"254700000000"}'
  ```

  The response returns the checkout idempotency data and logs an event tagged
  with the correlation id.

* **Simulate webhook:**

  ```bash
  curl -X POST http://localhost:7071/api/v1/webhooks/mpesa \
    -H "content-type: application/json" \
    -d @scripts/fixtures/mpesa-success.json
  ```

  Replace the checkout id in the fixture with the one from the `pay` step. The
  API should return `{ "ok": true }`, update the payment + order documents, and
  enqueue a receipt job.

## 6. Queue worker

Azurite exposes storage queues on `UseDevelopmentStorage=true`. Inspect the
`jobs` queue with [`az storage message peek`](https://learn.microsoft.com/azure/storage/queues/storage-tutorial-queues-cli)
or the Azurite Visual Studio Code extension.

To run the worker locally, leave the Functions host running—the worker is
executed in the same process. A successful receipt run generates two Cosmos
patches (`receipts` document creation plus sent markers) and uploads a PDF to
the `public/receipts/<merchant>/<order>.pdf` blob.

## 7. Frontend PWA

```bash
cd frontend
pnpm dev
```

Point the Vite dev server to the running API by setting `VITE_API_BASE` in the
frontend `.env.local`. From the UI you can:

1. Add catalog items (wired to the `v1/products` route).
2. Place an order and trigger the checkout flow, which calls
   `POST /v1/orders/:id/pay` and surfaces the pending STK status.

## 8. End-to-end rehearsal script

Automate a full sandbox run with the helper script:

```bash
pnpm ts-node --project scripts/tsconfig.json scripts/e2e-happy-path.ts \
  --merchant m_001 \
  --order demo-order-001 \
  --phone 254700000000
```

The script should:

1. Upsert product + order fixtures into Cosmos DB.
2. Call the payment route and capture the checkout ID.
3. Post the webhook payload.
4. Poll Cosmos/Blob storage to assert the order is marked `PAID` and a receipt
   exists.

## 9. Troubleshooting + modification workflow

When a change is required:

1. **Write or update a test** that fails with the current behaviour.
2. Modify the implementation in `api/src` or `frontend/src` as needed.
3. Re-run `pnpm lint`, `pnpm typecheck`, and the targeted test command.
4. Verify the affected manual steps from sections 5–8.

Document unexpected issues in `docs/runbook.md` so the next engineer can repeat
the fix quickly.

