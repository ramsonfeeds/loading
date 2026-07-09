import type { Request, Response } from 'express';
import { z } from 'zod';
import { ProductService } from './product.service.js';
import { productCreateSchema, productSearchSchema, productUpdateSchema } from './product.schemas.js';

const idSchema = z.coerce.number().int().positive();

export class ProductController {
  private readonly service = new ProductService();

  list = async (request: Request, response: Response): Promise<void> => {
    const query = productSearchSchema.parse(request.query);
    response.json(await this.service.list(query));
  };

  create = async (request: Request, response: Response): Promise<void> => {
    const body = productCreateSchema.parse(request.body);
    response.status(201).json(await this.service.create(body));
  };

  update = async (request: Request, response: Response): Promise<void> => {
    const id = idSchema.parse(request.params.id);
    const body = productUpdateSchema.parse(request.body);
    response.json(await this.service.update(id, body));
  };

  delete = async (request: Request, response: Response): Promise<void> => {
    const id = idSchema.parse(request.params.id);
    await this.service.delete(id);
    response.status(204).send();
  };
}
