import { HttpError } from '../../utils/http-error.js';
import { DispatchRepository } from './dispatch.repository.js';
import type { DispatchSaveInput, DispatchSearchInput } from './dispatch.schemas.js';

export class DispatchService {
  private readonly repository = new DispatchRepository();

  list(query: DispatchSearchInput) {
    return this.repository.findMany(query);
  }

  async get(id: number) {
    const dispatch = await this.repository.findById(id);
    if (!dispatch) {
      throw new HttpError(404, 'Dispatch not found');
    }
    return dispatch;
  }

  create(input: DispatchSaveInput) {
    return this.repository.create(input);
  }

  async update(id: number, input: DispatchSaveInput) {
    await this.get(id);
    return this.repository.update(id, input);
  }

  async duplicate(id: number) {
    const source = await this.get(id);
    return this.repository.create({
      dispatchDate: source.dispatchDate.slice(0, 10),
      title: `${source.title} Copy`,
      factory: source.factory,
      groups: source.groups.map(group => ({
        sortOrder: group.sortOrder,
        items: group.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          description: item.description,
          sortOrder: item.sortOrder,
          allocations: item.allocations.map(allocation => ({
            factory: allocation.factory,
            source: allocation.source,
            quantity: allocation.quantity
          }))
        }))
      }))
    });
  }

  async delete(id: number) {
    await this.get(id);
    return this.repository.delete(id);
  }
}
