import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Lazy connection: only create when env vars present & accessed
let _db: ReturnType<typeof drizzle> | undefined;

export function getDb() {
  if (_db) return _db;
  const connectionString = process.env.DRIZZLE_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Missing DRIZZLE_DATABASE_URL or DATABASE_URL env var');
  }
  _db = drizzle(postgres(connectionString, { prepare: false }), { schema });
  return _db;
}

export * from './schema';
