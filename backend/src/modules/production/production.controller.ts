import type { Request, Response } from 'express';
import { z } from 'zod';
import { productionGenerateSchema, productionListSaveSchema, productionSearchSchema } from './production.schemas.js';
import { ProductionService } from './production.service.js';

const idSchema = z.coerce.number().int().positive();

export class ProductionController {
  private readonly service = new ProductionService();

  list = async (request: Request, response: Response): Promise<void> => {
    const query = productionSearchSchema.parse(request.query);
    response.json(await this.service.list(query));
  };

  get = async (request: Request, response: Response): Promise<void> => {
    const id = idSchema.parse(request.params.id);
    response.json(await this.service.get(id));
  };

  create = async (request: Request, response: Response): Promise<void> => {
    const body = productionListSaveSchema.parse(request.body);
    response.status(201).json(await this.service.create(body));
  };

  update = async (request: Request, response: Response): Promise<void> => {
    const id = idSchema.parse(request.params.id);
    const body = productionListSaveSchema.parse(request.body);
    response.json(await this.service.update(id, body));
  };

  generate = async (request: Request, response: Response): Promise<void> => {
    const query = productionGenerateSchema.parse(request.query);
    response.status(200).json(await this.service.generate(query));
  };

  delete = async (request: Request, response: Response): Promise<void> => {
    const id = idSchema.parse(request.params.id);
    await this.service.delete(id);
    response.status(204).send();
  };
}
