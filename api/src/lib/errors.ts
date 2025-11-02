export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(code: string, status = 400, message?: string, details?: unknown) {
    super(message ?? code);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const Errors = {
  Validation: (details?: unknown) =>
    new AppError('VALIDATION_ERROR', 422, 'Invalid input', details),
  NotFound: (message = 'Not found') => new AppError('NOT_FOUND', 404, message),
  Conflict: (message = 'Conflict') => new AppError('CONFLICT', 409, message),
  Forbidden: (message = 'Forbidden') => new AppError('FORBIDDEN', 403, message),
  Provider: (message = 'Provider error', details?: unknown) =>
    new AppError('PROVIDER_ERROR', 502, message, details),
  Idempotent: (message = 'Duplicate event') =>
    new AppError('IDEMPOTENT_REPLAY', 200, message),
};

export type Problem = {
  type: string;
  title: string;
  detail?: string;
  code?: string;
  correlationId?: string;
};

export const toProblem = (error: unknown, correlationId: string): [number, Problem] => {
  if (error instanceof AppError) {
    return [
      error.status,
      {
        type: `https://errors.whatshelf.app/${error.code}`,
        title: error.message,
        detail: typeof error.details === 'string' ? error.details : undefined,
        code: error.code,
        correlationId,
      },
    ];
  }

  const message = error instanceof Error ? error.message : 'Unknown error';
  return [
    500,
    {
      type: 'https://errors.whatshelf.app/INTERNAL',
      title: 'Internal error',
      detail: message,
      correlationId,
    },
  ];
};
