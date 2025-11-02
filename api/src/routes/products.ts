import { randomUUID } from 'node:crypto';
import { app, type HttpRequest, type HttpResponseInit } from '@azure/functions';
import { containers } from '../lib/db.js';
import { Errors, toProblem } from '../lib/errors.js';
import { correlationId } from '../lib/context.js';

app.http('postProduct', {
  methods: ['POST'],
  route: 'v1/products',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    const corr = correlationId(req.headers as any);
    try {
      const merchantId = req.headers.get('x-merchant-id');
      if (!merchantId) {
        throw Errors.Forbidden('Missing merchant context');
      }
      const body = await req.json();
      const doc = {
        id: randomUUID(),
        merchantId,
        ...body,
        createdAt: new Date().toISOString(),
      };
      await containers.products.items.create(doc, { partitionKey: merchantId });
      return { status: 201, jsonBody: doc, headers: { 'x-correlation-id': corr } };
    } catch (error) {
      const [status, problem] = toProblem(error, corr);
      return { status, jsonBody: problem, headers: { 'x-correlation-id': corr } };
    }
  },
});
