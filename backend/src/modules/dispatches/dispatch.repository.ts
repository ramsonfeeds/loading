import { getDatabase } from '../../database/database.js';
import { mapProduct } from '../../database/mappers.js';
import type {
  DispatchGroupRow,
  DispatchItemRow,
  DispatchRow,
  LastIdResult,
  SqlDispatchGroupRecord,
  SqlDispatchItemRecord,
  SqlDispatchRecord,
  SqlProductRecord
} from '../../database/types.js';
import { HttpError } from '../../utils/http-error.js';
import type { DispatchSaveInput, DispatchSearchInput } from './dispatch.schemas.js';

type ItemJoinRecord = SqlDispatchItemRecord & {
  product_english_name: string;
  product_tamil_name: string;
  product_weight: number;
  product_active: number;
  product_created_at: string;
  product_updated_at: string;
};

export class DispatchRepository {
  async findMany(query: DispatchSearchInput): Promise<DispatchRow[]> {
    const database = await getDatabase();
    const where: string[] = [];
    const params: unknown[] = [];

    if (query.date) {
      where.push('d.dispatch_date = ?');
      params.push(query.date);
    }

    if (query.title) {
      where.push('d.title LIKE ?');
      params.push(`%${query.title}%`);
    }

    if (query.product) {
      where.push(`
        EXISTS (
          SELECT 1
          FROM dispatch_groups g
          JOIN dispatch_items i ON i.group_id = g.id
          JOIN products p ON p.id = i.product_id
          WHERE g.dispatch_id = d.id
            AND (p.english_name LIKE ? OR p.tamil_name LIKE ?)
        )
      `);
      params.push(`%${query.product}%`, `%${query.product}%`);
    }

    const dispatches = await database.all<SqlDispatchRecord[]>(
      `
        SELECT d.id, d.dispatch_date, d.title, d.created_at, d.updated_at
        FROM dispatches d
        ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY d.dispatch_date DESC, d.updated_at DESC
        LIMIT 200
      `,
      params
    );

    return Promise.all(dispatches.map(dispatch => this.hydrate(dispatch)));
  }

  async findById(id: number): Promise<DispatchRow | undefined> {
    const database = await getDatabase();
    const dispatch = await database.get<SqlDispatchRecord>(
      'SELECT id, dispatch_date, title, created_at, updated_at FROM dispatches WHERE id = ?',
      id
    );
    return dispatch ? this.hydrate(dispatch) : undefined;
  }

  async create(data: DispatchSaveInput): Promise<DispatchRow> {
    const database = await getDatabase();
    await database.run('BEGIN IMMEDIATE TRANSACTION');
    try {
      const result = await database.run(
        'INSERT INTO dispatches (dispatch_date, title) VALUES (?, ?)',
        data.dispatchDate,
        data.title
      ) as LastIdResult;
      const dispatchId = Number(result.lastID);

      await this.insertGroups(dispatchId, data);
      await database.run('COMMIT');

      return this.findRequiredById(dispatchId);
    } catch (error) {
      await database.run('ROLLBACK');
      throw error;
    }
  }

  async update(id: number, data: DispatchSaveInput): Promise<DispatchRow> {
    const database = await getDatabase();
    await database.run('BEGIN IMMEDIATE TRANSACTION');
    try {
      await database.run('UPDATE dispatches SET dispatch_date = ?, title = ? WHERE id = ?', data.dispatchDate, data.title, id);
      await database.run(
        'DELETE FROM dispatch_items WHERE group_id IN (SELECT id FROM dispatch_groups WHERE dispatch_id = ?)',
        id
      );
      await database.run('DELETE FROM dispatch_groups WHERE dispatch_id = ?', id);
      await this.insertGroups(id, data);
      await database.run('COMMIT');

      return this.findRequiredById(id);
    } catch (error) {
      await database.run('ROLLBACK');
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    const database = await getDatabase();
    await database.run('DELETE FROM dispatches WHERE id = ?', id);
  }

  private async findRequiredById(id: number): Promise<DispatchRow> {
    const dispatch = await this.findById(id);
    if (!dispatch) {
      throw new HttpError(404, 'Dispatch not found');
    }
    return dispatch;
  }

  private async insertGroups(dispatchId: number, data: DispatchSaveInput): Promise<void> {
    const database = await getDatabase();

    for (const group of data.groups) {
      const groupResult = await database.run(
        'INSERT INTO dispatch_groups (dispatch_id, sort_order) VALUES (?, ?)',
        dispatchId,
        group.sortOrder
      ) as LastIdResult;
      const groupId = Number(groupResult.lastID);

      for (const item of group.items) {
        await database.run(
          `
            INSERT INTO dispatch_items (group_id, product_id, quantity, description, sort_order)
            VALUES (?, ?, ?, ?, ?)
          `,
          groupId,
          item.productId,
          item.quantity,
          item.description || null,
          item.sortOrder
        );
      }
    }
  }

  private async hydrate(dispatch: SqlDispatchRecord): Promise<DispatchRow> {
    const database = await getDatabase();
    const groups = await database.all<SqlDispatchGroupRecord[]>(
      `
        SELECT id, dispatch_id, sort_order, created_at, updated_at
        FROM dispatch_groups
        WHERE dispatch_id = ?
        ORDER BY sort_order ASC
      `,
      dispatch.id
    );

    const hydratedGroups = await Promise.all(groups.map(group => this.hydrateGroup(group)));

    return {
      id: dispatch.id,
      dispatchDate: dispatch.dispatch_date,
      title: dispatch.title,
      createdAt: dispatch.created_at,
      updatedAt: dispatch.updated_at,
      groups: hydratedGroups
    };
  }

  private async hydrateGroup(group: SqlDispatchGroupRecord): Promise<DispatchGroupRow> {
    const database = await getDatabase();
    const items = await database.all<ItemJoinRecord[]>(
      `
        SELECT
          i.id,
          i.group_id,
          i.product_id,
          i.quantity,
          i.description,
          i.sort_order,
          i.created_at,
          i.updated_at,
          p.english_name AS product_english_name,
          p.tamil_name AS product_tamil_name,
          p.weight AS product_weight,
          p.active AS product_active,
          p.created_at AS product_created_at,
          p.updated_at AS product_updated_at
        FROM dispatch_items i
        JOIN products p ON p.id = i.product_id
        WHERE i.group_id = ?
        ORDER BY i.sort_order ASC
      `,
      group.id
    );

    return {
      id: group.id,
      dispatchId: group.dispatch_id,
      sortOrder: group.sort_order,
      createdAt: group.created_at,
      updatedAt: group.updated_at,
      items: items.map(item => this.mapItem(item))
    };
  }

  private mapItem(item: ItemJoinRecord): DispatchItemRow {
    const productRecord: SqlProductRecord = {
      id: item.product_id,
      english_name: item.product_english_name,
      tamil_name: item.product_tamil_name,
      weight: item.product_weight,
      active: item.product_active,
      created_at: item.product_created_at,
      updated_at: item.product_updated_at
    };

    return {
      id: item.id,
      groupId: item.group_id,
      productId: item.product_id,
      quantity: item.quantity,
      description: item.description,
      sortOrder: item.sort_order,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      product: mapProduct(productRecord)
    };
  }
}
