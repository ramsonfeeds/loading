import { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma.js';
import { mapDispatch } from '../../database/prisma.mappers.js';
import type { DispatchRow } from '../../database/types.js';
import type { DispatchSaveInput, DispatchSearchInput } from './dispatch.schemas.js';

export class DispatchRepository {
  async findMany(query: DispatchSearchInput): Promise<DispatchRow[]> {
    const where: Prisma.DispatchWhereInput = {};

    if (query.date) {
      where.dispatchDate = query.date;
    }

    if (query.title) {
      where.title = { contains: query.title, mode: 'insensitive' };
    }

    if (query.product) {
      where.groups = {
        some: {
          items: {
            some: {
              product: {
                OR: [
                  { englishName: { contains: query.product, mode: 'insensitive' } },
                  { tamilName: { contains: query.product, mode: 'insensitive' } }
                ]
              }
            }
          }
        }
      };
    }

    const dispatches = await prisma.dispatch.findMany({
      where,
      orderBy: [{ dispatchDate: 'desc' }, { updatedAt: 'desc' }],
      take: 200,
      include: {
        groups: {
          orderBy: { sortOrder: 'asc' },
          include: {
            items: {
              orderBy: { sortOrder: 'asc' },
              include: {
                product: true,
                allocations: { orderBy: [{ source: 'asc' }, { factory: 'asc' }] }
              }
            }
          }
        }
      }
    });

    return dispatches.map(mapDispatch);
  }

  async findById(id: number): Promise<DispatchRow | undefined> {
    const dispatch = await prisma.dispatch.findUnique({
      where: { id },
      include: {
        groups: {
          orderBy: { sortOrder: 'asc' },
          include: {
            items: {
              orderBy: { sortOrder: 'asc' },
              include: {
                product: true,
                allocations: { orderBy: [{ source: 'asc' }, { factory: 'asc' }] }
              }
            }
          }
        }
      }
    });

    return dispatch ? mapDispatch(dispatch) : undefined;
  }

  async create(data: DispatchSaveInput): Promise<DispatchRow> {
    const dispatchId = await prisma.$transaction(
      async transaction => {
        const dispatch = await transaction.dispatch.create({
          data: {
            dispatchDate: data.dispatchDate,
            title: data.title,
            factory: data.factory
          }
        });

        await this.insertGroups(transaction, dispatch.id, data.groups);

        return dispatch.id;
      },
      {
        timeout: 30000
      }
    );

    const persistedDispatch = await prisma.dispatch.findUniqueOrThrow({
      where: { id: dispatchId },
      include: {
        groups: {
          orderBy: { sortOrder: 'asc' },
          include: {
            items: {
              orderBy: { sortOrder: 'asc' },
              include: {
                product: true,
                allocations: {
                  orderBy: [
                    { source: 'asc' },
                    { factory: 'asc' }
                  ]
                }
              }
            }
          }
        }
      }
    });

    return mapDispatch(persistedDispatch);
  }

  async update(id: number, data: DispatchSaveInput): Promise<DispatchRow> {
    await prisma.$transaction(
      async transaction => {
        await transaction.dispatch.update({
          where: { id },
          data: {
            dispatchDate: data.dispatchDate,
            title: data.title,
            factory: data.factory
          }
        });

        await transaction.dispatchItem.deleteMany({
          where: {
            group: {
              dispatchId: id
            }
          }
        });

        await transaction.dispatchGroup.deleteMany({
          where: {
            dispatchId: id
          }
        });

        await this.insertGroups(transaction, id, data.groups);
      },
      {
        timeout: 30000
      }
    );

    const persistedDispatch = await prisma.dispatch.findUniqueOrThrow({
      where: { id },
      include: {
        groups: {
          orderBy: { sortOrder: 'asc' },
          include: {
            items: {
              orderBy: { sortOrder: 'asc' },
              include: {
                product: true,
                allocations: {
                  orderBy: [
                    { source: 'asc' },
                    { factory: 'asc' }
                  ]
                }
              }
            }
          }
        }
      }
    });

    return mapDispatch(persistedDispatch);
  }

  async delete(id: number): Promise<void> {
    await prisma.dispatch.delete({ where: { id } });
  }

  private async insertGroups(
    transaction: Prisma.TransactionClient,
    dispatchId: number,
    groups: DispatchSaveInput['groups']
  ): Promise<void> {
    for (const group of groups) {
      const createdGroup = await transaction.dispatchGroup.create({
        data: {
          dispatchId,
          sortOrder: group.sortOrder
        }
      });

      for (const item of group.items) {
        const createdItem = await transaction.dispatchItem.create({
          data: {
            groupId: createdGroup.id,
            productId: item.productId,
            quantity: item.quantity,
            description: item.description ?? null,
            sortOrder: item.sortOrder
          }
        });

        if (item.allocations.length > 0) {
          await transaction.dispatchAllocation.createMany({
            data: item.allocations.map(allocation => ({
              itemId: createdItem.id,
              factory: allocation.factory,
              source: allocation.source,
              quantity: allocation.quantity
            }))
          });
        }
      }
    }
  }
}
