import { Router } from 'express';
import { dispatchRoutes } from './modules/dispatches/dispatch.routes.js';
import { productRoutes } from './modules/products/product.routes.js';

export const apiRoutes = Router()
  .get('/health', (_request, response) => {
    response.json({ status: 'ok' });
  })
  .use('/products', productRoutes)
  .use('/dispatches', dispatchRoutes);
