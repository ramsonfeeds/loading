import { mkdir } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import { env } from '../config/env.js';
import { schemaSql } from './schema.js';

export type AppDatabase = Database<sqlite3.Database, sqlite3.Statement>;

let databasePromise: Promise<AppDatabase> | null = null;

export async function getDatabase(): Promise<AppDatabase> {
  if (!databasePromise) {
    databasePromise = openDatabase();
  }

  return databasePromise;
}

async function openDatabase(): Promise<AppDatabase> {
  const filename = isAbsolute(env.SQLITE_DATABASE_PATH)
    ? env.SQLITE_DATABASE_PATH
    : resolve(process.cwd(), env.SQLITE_DATABASE_PATH);

  await mkdir(dirname(filename), { recursive: true });

  const database = await open({
    filename,
    driver: sqlite3.Database
  });

  await database.exec('PRAGMA foreign_keys = ON;');
  await database.exec('PRAGMA journal_mode = WAL;');
  await database.exec('PRAGMA busy_timeout = 5000;');
  await database.exec(schemaSql);

  return database;
}
