import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { ProductController } from './product.controller.js';

const controller = new ProductController();

export const productRoutes = Router()
  .get('/', asyncHandler(controller.list))
  .post('/', asyncHandler(controller.create))
  .put('/:id', asyncHandler(controller.update))
  .delete('/:id', asyncHandler(controller.delete));
