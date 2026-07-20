import { Factory } from '@prisma/client';
import { prisma } from '../../database/prisma.js';
import { HttpError } from '../../utils/http-error.js';
import { ProductionRepository } from './production.repository.js';
import type { ProductionGenerateInput, ProductionListSaveInput, ProductionSearchInput } from './production.schemas.js';

type FactoryTotals = Record<Factory, Map<number, number>>;

export class ProductionService {
  private readonly repository = new ProductionRepository();

  list(query: ProductionSearchInput) {
    return this.repository.findMany(query);
  }

  async get(id: number) {
    const list = await this.repository.findById(id);
    if (!list) {
      throw new HttpError(404, 'Production list not found');
    }
    return list;
  }

  create(input: ProductionListSaveInput) {
    return this.repository.create(input);
  }

  async update(id: number, input: ProductionListSaveInput) {
    await this.get(id);
    return this.repository.update(id, input);
  }

  async generate(input: ProductionGenerateInput) {
    const dispatches = await prisma.dispatch.findMany({
      where: { dispatchDate: input.date },
      include: {
        groups: {
          orderBy: { sortOrder: 'asc' },
          include: {
            items: {
              orderBy: { sortOrder: 'asc' },
              include: {
                product: true,
                allocations: true
              }
            }
          }
        }
      }
    });

    if (dispatches.length === 0) {
      throw new HttpError(404, 'No dispatches found for production date');
    }

    const totals: FactoryTotals = {
      R: new Map<number, number>(),
      S: new Map<number, number>()
    };

    for (const dispatch of dispatches) {
      for (const group of dispatch.groups) {
        for (const item of group.items) {

          // Purchased products never appear in production
          if (item.product.productType === 'PURCHASED') {
            continue;
          }

          // Default behaviour:
          // No allocation means produce the full quantity
          if (item.allocations.length === 0) {
            this.addTotal(
              totals[dispatch.factory],
              item.productId,
              item.quantity
            );
            continue;
          }

          // Explicit allocations
          for (const allocation of item.allocations) {
            if (allocation.source === 'PRODUCTION') {
              this.addTotal(
                totals[allocation.factory],
                item.productId,
                allocation.quantity
              );
            }
          }
        }
      }
    }

    const lists: ProductionListSaveInput[] = (['R', 'S'] as Factory[])
      .map(factory => ({
        productionDate: input.date,
        title: `Factory ${factory} Production`,
        factory,
        sourceDispatchId: null,
        items: Array.from(totals[factory].entries()).map(([productId, quantity], sortOrder) => ({
          productId,
          quantity,
          sortOrder
        }))
      }))
      .filter(list => list.items.length > 0);

    return this.repository.replaceGeneratedForDate(input.date, lists);
  }

  async delete(id: number) {
    await this.get(id);
    return this.repository.delete(id);
  }

  private addTotal(totals: Map<number, number>, productId: number, quantity: number): void {
    totals.set(productId, (totals.get(productId) ?? 0) + quantity);
  }
}
