import type { ZodSchema } from 'zod';
import { Errors } from './errors.js';

export const validate = <T>(schema: ZodSchema<T>, input: unknown): T => {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw Errors.Validation(result.error.flatten());
  }
  return result.data;
};
