import type { Request, Response } from 'express';
import { z } from 'zod';
import { dispatchSaveSchema, dispatchSearchSchema } from './dispatch.schemas.js';
import { DispatchService } from './dispatch.service.js';

const idSchema = z.coerce.number().int().positive();

export class DispatchController {
  private readonly service = new DispatchService();

  list = async (request: Request, response: Response): Promise<void> => {
    const query = dispatchSearchSchema.parse(request.query);
    response.json(await this.service.list(query));
  };

  get = async (request: Request, response: Response): Promise<void> => {
    const id = idSchema.parse(request.params.id);
    response.json(await this.service.get(id));
  };

  create = async (request: Request, response: Response): Promise<void> => {
    const body = dispatchSaveSchema.parse(request.body);
    response.status(201).json(await this.service.create(body));
  };

  update = async (request: Request, response: Response): Promise<void> => {
    const id = idSchema.parse(request.params.id);
    const body = dispatchSaveSchema.parse(request.body);
    response.json(await this.service.update(id, body));
  };

  duplicate = async (request: Request, response: Response): Promise<void> => {
    const id = idSchema.parse(request.params.id);
    response.status(201).json(await this.service.duplicate(id));
  };

  delete = async (request: Request, response: Response): Promise<void> => {
    const id = idSchema.parse(request.params.id);
    await this.service.delete(id);
    response.status(204).send();
  };
}
