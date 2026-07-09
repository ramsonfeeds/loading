import { HttpError } from '../../utils/http-error.js';
import { ProductRepository } from './product.repository.js';
import type { ProductCreateInput, ProductSearchInput, ProductUpdateInput } from './product.schemas.js';

export class ProductService {
  private readonly repository = new ProductRepository();

  list(query: ProductSearchInput) {
    return this.repository.findMany(query);
  }

  async create(input: ProductCreateInput) {
    return this.repository.create(input);
  }

  async update(id: number, input: ProductUpdateInput) {
    await this.ensureExists(id);
    return this.repository.update(id, input);
  }

  async delete(id: number) {
    await this.ensureExists(id);
    return this.repository.delete(id);
  }

  private async ensureExists(id: number): Promise<void> {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new HttpError(404, 'Product not found');
    }
  }
}
