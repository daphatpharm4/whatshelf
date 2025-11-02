import { v4 as uuid } from 'uuid';

export const correlationId = (headers: Record<string, string | undefined>) =>
  headers['x-correlation-id'] || uuid();
