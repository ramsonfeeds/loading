import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const prisma = new PrismaClient();
const sourcePath = resolve(process.cwd(), process.argv[2] ?? './data/dispatch.sqlite');

if (!existsSync(sourcePath)) {
  throw new Error(`SQLite source file not found at ${sourcePath}`);
}

const database = await open({
  filename: sourcePath,
  driver: sqlite3.Database
});

await prisma.$connect();

try {
  const products = await database.all<{
    id: number;
    english_name: string;
    tamil_name: string;
    weight: number;
    active: number;
    created_at: string;
    updated_at: string;
  }[]>(
    'SELECT id, english_name, tamil_name, weight, active, created_at, updated_at FROM products ORDER BY id ASC'
  );

  const dispatches = await database.all<{
    id: number;
    dispatch_date: string;
    title: string;
    created_at: string;
    updated_at: string;
  }[]>(
    'SELECT id, dispatch_date, title, created_at, updated_at FROM dispatches ORDER BY id ASC'
  );

  const groups = await database.all<{
    id: number;
    dispatch_id: number;
    sort_order: number;
    created_at: string;
    updated_at: string;
  }[]>(
    'SELECT id, dispatch_id, sort_order, created_at, updated_at FROM dispatch_groups ORDER BY id ASC'
  );

  const items = await database.all<{
    id: number;
    group_id: number;
    product_id: number;
    quantity: number;
    description: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
  }[]>(
    'SELECT id, group_id, product_id, quantity, description, sort_order, created_at, updated_at FROM dispatch_items ORDER BY id ASC'
  );

  await prisma.$transaction([
    prisma.product.createMany({
      data: products.map(product => ({
        id: product.id,
        englishName: product.english_name,
        tamilName: product.tamil_name,
        weight: product.weight,
        active: product.active === 1,
        createdAt: new Date(product.created_at),
        updatedAt: new Date(product.updated_at)
      }))
    }),
    prisma.dispatch.createMany({
      data: dispatches.map(dispatch => ({
        id: dispatch.id,
        dispatchDate: dispatch.dispatch_date,
        title: dispatch.title,
        createdAt: new Date(dispatch.created_at),
        updatedAt: new Date(dispatch.updated_at)
      }))
    }),
    prisma.dispatchGroup.createMany({
      data: groups.map(group => ({
        id: group.id,
        dispatchId: group.dispatch_id,
        sortOrder: group.sort_order,
        createdAt: new Date(group.created_at),
        updatedAt: new Date(group.updated_at)
      }))
    }),
    prisma.dispatchItem.createMany({
      data: items.map(item => ({
        id: item.id,
        groupId: item.group_id,
        productId: item.product_id,
        quantity: item.quantity,
        description: item.description ?? null,
        sortOrder: item.sort_order,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }))
    })
  ]);

  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 1), true);`);
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('dispatches', 'id'), COALESCE((SELECT MAX(id) FROM dispatches), 1), true);`);
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('dispatch_groups', 'id'), COALESCE((SELECT MAX(id) FROM dispatch_groups), 1), true);`);
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('dispatch_items', 'id'), COALESCE((SELECT MAX(id) FROM dispatch_items), 1), true);`);

  console.log(`Imported ${products.length} products, ${dispatches.length} dispatches, ${groups.length} groups, and ${items.length} items.`);
} finally {
  await database.close();
  await prisma.$disconnect();
}
