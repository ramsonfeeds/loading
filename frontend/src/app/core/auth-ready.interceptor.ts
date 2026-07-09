import { HttpInterceptorFn } from '@angular/common/http';

export const authReadyInterceptor: HttpInterceptorFn = (request, next) => {
  return next(request);
};
