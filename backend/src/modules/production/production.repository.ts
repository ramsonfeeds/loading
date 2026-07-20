import { Factory, Prisma, ProductionItemSource } from '@prisma/client';
import { prisma } from '../../database/prisma.js';
import { mapProductionList } from '../../database/prisma.mappers.js';
import type { ProductionListRow } from '../../database/types.js';
import type { ProductionListSaveInput, ProductionSearchInput } from './production.schemas.js';

const includeItems = {
  items: {
    orderBy: { sortOrder: 'asc' },
    include: { product: true }
  }
} satisfies Prisma.ProductionListInclude;

export class ProductionRepository {
  async findMany(query: ProductionSearchInput): Promise<ProductionListRow[]> {
    const lists = await prisma.productionList.findMany({
      where: {
        ...(query.date ? { productionDate: query.date } : {}),
        ...(query.factory ? { factory: query.factory } : {})
      },
      orderBy: [{ productionDate: 'desc' }, { factory: 'asc' }, { updatedAt: 'desc' }],
      take: 200,
      include: includeItems
    });

    return lists.map(mapProductionList);
  }

  async findById(id: number): Promise<ProductionListRow | undefined> {
    const list = await prisma.productionList.findUnique({
      where: { id },
      include: includeItems
    });

    return list ? mapProductionList(list) : undefined;
  }

  async create(data: ProductionListSaveInput): Promise<ProductionListRow> {
    return prisma.$transaction(async transaction => {
      const list = await this.findOrCreateList(transaction, data);

      await transaction.productionItem.deleteMany({
        where: {
          productionListId: list.id,
          sourceType: 'MANUAL'
        }
      });
      await this.insertItems(transaction, list.id, data.items, 'MANUAL');
      return this.findPersisted(transaction, list.id);
    });
  }

  async update(id: number, data: ProductionListSaveInput): Promise<ProductionListRow> {
    return prisma.$transaction(async transaction => {
      await transaction.productionList.update({
        where: { id },
        data: {
          productionDate: data.productionDate,
          title: data.title,
          factory: data.factory,
          sourceDispatchId: data.sourceDispatchId ?? null
        }
      });

      await transaction.productionItem.deleteMany({ where: { productionListId: id } });
      await this.insertItems(transaction, id, data.items, 'MANUAL');
      return this.findPersisted(transaction, id);
    });
  }

  async replaceGeneratedForDate(
    date: string,
    lists: ProductionListSaveInput[]
  ): Promise<ProductionListRow[]> {

    const ids = await prisma.$transaction(
      async transaction => {

        const ids: number[] = [];

        for (const list of lists) {

          const persisted = await this.findOrCreateList(transaction, {
            ...list,
            productionDate: date,
            sourceDispatchId: null
          });

          await transaction.productionItem.deleteMany({
            where: {
              productionListId: persisted.id,
              sourceType: 'AUTO'
            }
          });

          const maxSort = await transaction.productionItem.aggregate({
            where: {
              productionListId: persisted.id
            },
            _max: {
              sortOrder: true
            }
          });

          const sortOffset = (maxSort._max.sortOrder ?? -1) + 1;

          await this.insertItems(
            transaction,
            persisted.id,
            list.items.map(item => ({
              ...item,
              sortOrder: item.sortOrder + sortOffset
            })),
            'AUTO'
          );

          ids.push(persisted.id);
        }

        for (const factory of ['R', 'S'] as Factory[]) {

          if (lists.some(list => list.factory === factory)) {
            continue;
          }

          const existing = await this.findPrimaryList(
            transaction,
            date,
            factory
          );

          if (!existing) {
            continue;
          }

          await transaction.productionItem.deleteMany({
            where: {
              productionListId: existing.id,
              sourceType: 'AUTO'
            }
          });

          const manualCount = await transaction.productionItem.count({
            where: {
              productionListId: existing.id,
              sourceType: 'MANUAL'
            }
          });

          if (manualCount === 0) {
            await transaction.productionList.delete({
              where: {
                id: existing.id
              }
            });
          } else {
            ids.push(existing.id);
          }
        }

        return ids;

      },
      {
        timeout: 30000
      }
    );

    const persisted = await prisma.productionList.findMany({
      where: {
        id: {
          in: ids
        }
      },
      orderBy: {
        factory: 'asc'
      },
      include: includeItems
    });

    return persisted.map(mapProductionList);
  }

  async delete(id: number): Promise<void> {
    await prisma.productionList.delete({ where: { id } });
  }

  private async insertItems(
    transaction: Prisma.TransactionClient,
    productionListId: number,
    items: ProductionListSaveInput['items'],
    defaultSourceType: ProductionItemSource
  ): Promise<void> {
    if (items.length === 0) {
      return;
    }

    await transaction.productionItem.createMany({
      data: items.map(item => ({
        productionListId,
        productId: item.productId,
        quantity: item.quantity,
        sortOrder: item.sortOrder,
        sourceType: item.sourceType ?? defaultSourceType
      }))
    });
  }

  private async findOrCreateList(
    transaction: Prisma.TransactionClient,
    data: ProductionListSaveInput
  ): Promise<{ id: number }> {
    const existing = await this.findPrimaryList(transaction, data.productionDate, data.factory);

    if (existing) {
      await transaction.productionList.update({
        where: { id: existing.id },
        data: {
          productionDate: data.productionDate,
          title: data.title,
          factory: data.factory,
          sourceDispatchId: data.sourceDispatchId ?? null
        }
      });

      return existing;
    }

    return transaction.productionList.create({
      data: {
        productionDate: data.productionDate,
        title: data.title,
        factory: data.factory,
        sourceDispatchId: data.sourceDispatchId ?? null
      },
      select: { id: true }
    });
  }

  private async findPrimaryList(
    transaction: Prisma.TransactionClient,
    date: string,
    factory: Factory
  ): Promise<{ id: number } | null> {
    const lists = await transaction.productionList.findMany({
      where: { productionDate: date, factory },
      orderBy: { createdAt: 'asc' },
      select: { id: true }
    });

    const [primary, ...duplicates] = lists;
    if (!primary) {
      return null;
    }

    for (const duplicate of duplicates) {
      const maxSort = await transaction.productionItem.aggregate({
        where: { productionListId: primary.id },
        _max: { sortOrder: true }
      });
      const nextSortOrder = (maxSort._max.sortOrder ?? -1) + 1;
      const duplicateItems = await transaction.productionItem.findMany({
        where: {
          productionListId: duplicate.id,
          sourceType: 'MANUAL'
        },
        orderBy: { sortOrder: 'asc' }
      });

      if (duplicateItems.length > 0) {
        await transaction.productionItem.createMany({
          data: duplicateItems.map((item, index) => ({
            productionListId: primary.id,
            productId: item.productId,
            quantity: item.quantity,
            sortOrder: nextSortOrder + index,
            sourceType: item.sourceType
          }))
        });
      }

      await transaction.productionList.delete({ where: { id: duplicate.id } });
    }

    return primary;
  }

  private async findPersisted(transaction: Prisma.TransactionClient, id: number): Promise<ProductionListRow> {
    const list = await transaction.productionList.findUniqueOrThrow({
      where: { id },
      include: includeItems
    });

    return mapProductionList(list);
  }
}
