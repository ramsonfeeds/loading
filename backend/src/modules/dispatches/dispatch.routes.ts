import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { DispatchController } from './dispatch.controller.js';

const controller = new DispatchController();

export const dispatchRoutes = Router()
  .get('/', asyncHandler(controller.list))
  .get('/:id', asyncHandler(controller.get))
  .post('/', asyncHandler(controller.create))
  .put('/:id', asyncHandler(controller.update))
  .post('/:id/duplicate', asyncHandler(controller.duplicate))
  .delete('/:id', asyncHandler(controller.delete));
