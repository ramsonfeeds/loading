import type { AsyncHandler } from '../types/http.js';

export function asyncHandler(handler: AsyncHandler): AsyncHandler {
  return async (request, response, next) => {
    try {
      await handler(request, response, next);
    } catch (error) {
      next(error);
    }
  };
}
