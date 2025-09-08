// Items table schema (feature-local, domain layer).
// Constraints: only Drizzle pg-core helpers & pure utilities. No React/Next/UI.
// To add new feature schemas: create app/<feature>/domain/schema.ts and export via lib/db/schema.ts aggregator.

import { pgTable, bigint, text, pgEnum } from 'drizzle-orm/pg-core';

// Reusable status value list & enum
// NOTE: Keep ITEM_STATUS_VALUES and pgEnum definition in sync if edited.
export const ITEM_STATUS_VALUES = ['active', 'inactive', 'archived'] as const;
export type ItemStatus = typeof ITEM_STATUS_VALUES[number];
export const itemStatusEnum = pgEnum('item_status', ITEM_STATUS_VALUES);

export const items = pgTable('items', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  description: text('description'),
  // Soft delete / lifecycle status: active | inactive | archived
  status: itemStatusEnum('status').notNull().default('active'),
});

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
