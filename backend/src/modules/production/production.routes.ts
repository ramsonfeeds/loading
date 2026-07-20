import { Router } from 'express';
import { ProductionController } from './production.controller.js';

const controller = new ProductionController();

export const productionRoutes = Router()
  .get('/', controller.list)
  .post('/', controller.create)
  .post('/generate', controller.generate)
  .get('/:id', controller.get)
  .put('/:id', controller.update)
  .delete('/:id', controller.delete);
