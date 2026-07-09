import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';

export const errorMiddleware: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({ message: 'Validation failed', issues: error.flatten() });
    return;
  }

  if (error instanceof HttpError) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }

  if (error instanceof Error && 'code' in error && typeof error.code === 'string' && error.code.startsWith('SQLITE_')) {
    response.status(400).json({ message: 'Database request failed', code: error.code });
    return;
  }

  response.status(500).json({
    message: 'Internal server error',
    detail: env.NODE_ENV === 'production' ? undefined : String(error)
  });
};
