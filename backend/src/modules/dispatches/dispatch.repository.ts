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
    const persistedDispatch = await prisma.dispatch.create({
      data: {
        dispatchDate: data.dispatchDate,
        title: data.title,
        factory: data.factory,
        groups: { create: this.groupWrites(data.groups) }
      },
      include: this.dispatchInclude
    });

    return mapDispatch(persistedDispatch);
  }

  async update(id: number, data: DispatchSaveInput): Promise<DispatchRow> {
    const [, persistedDispatch] = await prisma.$transaction([
      prisma.dispatch.update({
        where: { id },
        data: {
          dispatchDate: data.dispatchDate,
          title: data.title,
          factory: data.factory,
          groups: { deleteMany: {} }
        }
      }),
      prisma.dispatch.update({
        where: { id },
        data: { groups: { create: this.groupWrites(data.groups) } },
        include: this.dispatchInclude
      })
    ]);

    return mapDispatch(persistedDispatch);
  }

  async delete(id: number): Promise<void> {
    await prisma.dispatch.delete({ where: { id } });
  }

  private readonly dispatchInclude = {
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
  } satisfies Prisma.DispatchInclude;

  private groupWrites(groups: DispatchSaveInput['groups']): Prisma.DispatchGroupCreateWithoutDispatchInput[] {
    return groups.map(group => ({
      sortOrder: group.sortOrder,
      items: {
        create: group.items.map(item => ({
          product: { connect: { id: item.productId } },
          quantity: item.quantity,
          description: item.description ?? null,
          sortOrder: item.sortOrder,
          allocations: {
            create: item.allocations.map(allocation => ({
              factory: allocation.factory,
              source: allocation.source,
              quantity: allocation.quantity
            }))
          }
        }))
      }
    }));
  }
}
