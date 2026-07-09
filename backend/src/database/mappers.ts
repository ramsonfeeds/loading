import type { ProductRow, SqlProductRecord } from './types.js';

export function mapProduct(record: SqlProductRecord): ProductRow {
  return {
    id: record.id,
    englishName: record.english_name,
    tamilName: record.tamil_name,
    weight: record.weight,
    active: record.active === 1,
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}
