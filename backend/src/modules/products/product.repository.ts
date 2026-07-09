import { getDatabase } from '../../database/database.js';
import { mapProduct } from '../../database/mappers.js';
import type { LastIdResult, ProductRow, SqlProductRecord } from '../../database/types.js';
import { HttpError } from '../../utils/http-error.js';
import type { ProductCreateInput, ProductSearchInput, ProductUpdateInput } from './product.schemas.js';

export class ProductRepository {
  async findMany(query: ProductSearchInput): Promise<ProductRow[]> {
    const database = await getDatabase();
    const where: string[] = [];
    const params: unknown[] = [];

    if (query.active !== 'all') {
      where.push('active = ?');
      params.push(query.active === 'true' ? 1 : 0);
    }

    if (query.search) {
      where.push('(english_name LIKE ? OR tamil_name LIKE ?)');
      params.push(`%${query.search}%`, `%${query.search}%`);
    }

    const records = await database.all<SqlProductRecord[]>(
      `
        SELECT id, english_name, tamil_name, weight, active, created_at, updated_at
        FROM products
        ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY active DESC, english_name ASC
      `,
      params
    );
    return records.map(mapProduct);
  }

  async findById(id: number): Promise<ProductRow | undefined> {
    const database = await getDatabase();
    const record = await database.get<SqlProductRecord>(
      'SELECT id, english_name, tamil_name, weight, active, created_at, updated_at FROM products WHERE id = ?',
      id
    );
    return record ? mapProduct(record) : undefined;
  }

  async create(data: ProductCreateInput): Promise<ProductRow> {
    const database = await getDatabase();
    const result = await database.run(
      'INSERT INTO products (english_name, tamil_name, weight, active) VALUES (?, ?, ?, ?)',
      data.englishName,
      data.tamilName,
      data.weight,
      data.active ? 1 : 0
    ) as LastIdResult;

    return this.findRequiredById(Number(result.lastID));
  }

  async update(id: number, data: ProductUpdateInput): Promise<ProductRow> {
    const database = await getDatabase();
    const updates: string[] = [];
    const params: unknown[] = [];

    if (data.englishName !== undefined) {
      updates.push('english_name = ?');
      params.push(data.englishName);
    }
    if (data.tamilName !== undefined) {
      updates.push('tamil_name = ?');
      params.push(data.tamilName);
    }
    if (data.weight !== undefined) {
      updates.push('weight = ?');
      params.push(data.weight);
    }
    if (data.active !== undefined) {
      updates.push('active = ?');
      params.push(data.active ? 1 : 0);
    }

    params.push(id);
    await database.run(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, params);
    return this.findRequiredById(id);
  }

  async delete(id: number): Promise<void> {
    const database = await getDatabase();
    await database.run('DELETE FROM products WHERE id = ?', id);
  }

  private async findRequiredById(id: number): Promise<ProductRow> {
    const product = await this.findById(id);
    if (!product) {
      throw new HttpError(404, 'Product not found');
    }
    return product;
  }
}
