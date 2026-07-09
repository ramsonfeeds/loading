import { prisma } from './prisma.js';

export type AppDatabase = typeof prisma;

let databasePromise: Promise<AppDatabase> | null = null;

export async function getDatabase(): Promise<AppDatabase> {
  if (!databasePromise) {
    databasePromise = Promise.resolve(prisma);
  }

  return databasePromise;
}
