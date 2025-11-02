import { randomUUID } from 'node:crypto';
import { app, type HttpRequest, type HttpResponseInit } from '@azure/functions';
import { containers, readById } from '../lib/db.js';
import { Errors, toProblem } from '../lib/errors.js';
import { correlationId } from '../lib/context.js';
import QRCode from 'qrcode';

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

app.http('getProductQr', {
  methods: ['GET'],
  route: 'v1/products/{id}/qr',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    const corr = correlationId(req.headers as any);
    try {
      const merchantId = req.headers.get('x-merchant-id');
      if (!merchantId) {
        throw Errors.Forbidden('Missing merchant context');
      }

      const { id } = req.params;
      const { resource: product } = await readById('products', id, merchantId);
      if (!product) {
        throw Errors.NotFound('Product not found');
      }

      const waLink = buildWhatsappDeepLink(product, merchantId);
      const svg = await QRCode.toString(waLink, {
        type: 'svg',
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      });

      return {
        status: 200,
        headers: {
          'content-type': 'image/svg+xml',
          'cache-control': 'public, max-age=86400',
          'x-correlation-id': corr,
        },
        body: svg,
      };
    } catch (error) {
      const [status, problem] = toProblem(error, corr);
      return { status, jsonBody: problem, headers: { 'x-correlation-id': corr } };
    }
  },
});

const buildWhatsappDeepLink = (product: any, merchantId: string): string => {
  const message = encodeURIComponent(
    `Habari! Ninavutiwa na ${product.name ?? 'bidhaa'} kutoka kwa duka ${merchantId}.`,
  );
  const phone = product?.whatsappNumber ?? process.env.WHATSAPP_DEFAULT_NUMBER ?? '';
  const base = phone ? `https://wa.me/${phone}` : 'https://wa.me/';
  return `${base}?text=${message}`;
};
