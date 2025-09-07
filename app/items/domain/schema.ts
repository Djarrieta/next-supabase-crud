// Items table schema (feature-local, domain layer).
// Constraints: only Drizzle pg-core helpers & pure utilities. No React/Next/UI.
// To add new feature schemas: create app/<feature>/domain/schema.ts and export via lib/db/schema.ts aggregator.

import { pgTable, bigint, text } from 'drizzle-orm/pg-core';

export const items = pgTable('items', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  description: text('description'),
  // Soft delete / lifecycle status: active | inactive | archived
  status: text('status').notNull().default('active'),
});

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
