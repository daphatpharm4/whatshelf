import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { containers } from '../lib/db.js';
import { Errors, toProblem } from '../lib/errors.js';
import { correlationId } from '../lib/context.js';
import { computeMerchantMetrics } from '../domain/analytics.js';
import type { Order } from '../domain/order.js';
import { withCtx } from '../lib/logger.js';

const MAX_LOOKBACK_DAYS = 120;
const MS_IN_DAY = 1000 * 60 * 60 * 24;

app.http('getDashboardMetrics', {
  methods: ['GET'],
  route: 'v1/dashboard',
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const corr = correlationId(req.headers as any);
    const log = withCtx(corr);
    try {
      const merchantId = req.headers.get('x-merchant-id');
      if (!merchantId) {
        throw Errors.Forbidden('Missing merchant context');
      }

      const now = new Date();
      const from = new Date(now.getTime() - MAX_LOOKBACK_DAYS * MS_IN_DAY).toISOString();

      const querySpec = {
        query:
          'SELECT TOP 500 o.id, o.status, o.totals, o.items, o.buyer, o.createdAt, o.updatedAt FROM o WHERE o.merchantId = @merchantId AND (NOT IS_DEFINED(o.createdAt) OR o.createdAt >= @from) ORDER BY o.createdAt DESC',
        parameters: [
          { name: '@merchantId', value: merchantId },
          { name: '@from', value: from },
        ],
      };

      const { resources } = await containers.orders.items
        .query<Order>(querySpec, { partitionKey: merchantId })
        .fetchAll();

      const metrics = computeMerchantMetrics(resources ?? [], now);
      log.info({ event: 'DASHBOARD_METRICS_COMPUTED', merchantId, ordersAnalyzed: resources?.length ?? 0 });

      return {
        status: 200,
        jsonBody: {
          metrics,
          lookbackDays: MAX_LOOKBACK_DAYS,
          asOf: now.toISOString(),
        },
        headers: { 'x-correlation-id': corr },
      };
    } catch (error) {
      const [status, problem] = toProblem(error, corr);
      ctx.log.error(error as Error);
      return { status, jsonBody: problem, headers: { 'x-correlation-id': corr } };
    }
  },
});
