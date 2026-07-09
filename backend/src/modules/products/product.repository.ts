import { prisma } from '../../database/prisma.js';
import { mapProduct } from '../../database/prisma.mappers.js';
import type { ProductRow } from '../../database/types.js';
import type { ProductCreateInput, ProductSearchInput, ProductUpdateInput } from './product.schemas.js';

export class ProductRepository {
  async findMany(query: ProductSearchInput): Promise<ProductRow[]> {
    const products = await prisma.product.findMany({
      where: {
        ...(query.active !== 'all' ? { active: query.active === 'true' } : {}),
        ...(query.search
          ? {
              OR: [
                { englishName: { contains: query.search, mode: 'insensitive' } },
                { tamilName: { contains: query.search, mode: 'insensitive' } }
              ]
            }
          : {})
      },
      orderBy: [{ active: 'desc' }, { englishName: 'asc' }]
    });

    return products.map(mapProduct);
  }

  async findById(id: number): Promise<ProductRow | undefined> {
    const product = await prisma.product.findUnique({ where: { id } });
    return product ? mapProduct(product) : undefined;
  }

  async create(data: ProductCreateInput): Promise<ProductRow> {
    const product = await prisma.product.create({
      data: {
        englishName: data.englishName,
        tamilName: data.tamilName,
        weight: data.weight,
        active: data.active
      }
    });

    return mapProduct(product);
  }

  async update(id: number, data: ProductUpdateInput): Promise<ProductRow> {
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.englishName !== undefined ? { englishName: data.englishName } : {}),
        ...(data.tamilName !== undefined ? { tamilName: data.tamilName } : {}),
        ...(data.weight !== undefined ? { weight: data.weight } : {}),
        ...(data.active !== undefined ? { active: data.active } : {})
      }
    });

    return mapProduct(product);
  }

  async delete(id: number): Promise<void> {
    await prisma.product.delete({ where: { id } });
  }
}
