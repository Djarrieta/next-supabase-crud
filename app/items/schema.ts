// Items table schema (feature-local, domain layer).
// Constraints: only Drizzle pg-core helpers & pure utilities. No React/Next/UI.
// To add new feature schemas: create app/<feature>/domain/schema.ts and export via lib/db/schema.ts aggregator.

import { pgTable, bigint, text, pgEnum, numeric, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

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
  // Monetary sell price (stored as numeric(10,2)). Defaults to 0.00
  sellPrice: numeric('sell_price', { precision: 10, scale: 2 }).notNull().default('0'),
  // Whether the item is unique (boolean flag). Defaults to false
  unique: boolean('unique').notNull().default(false),
  // Array of tag ids (references item_tags.id). Maintained at service layer.
  tags: bigint('tags', { mode: 'number' }).array().notNull().default(sql`'{}'::bigint[]`),
  // Array of component item ids (self-referencing items.id). Maintained + validated at service layer.
  components: bigint('components', { mode: 'number' }).array().notNull().default(sql`'{}'::bigint[]`),
});

export type ItemStatusFilter = ItemStatus | 'all';
// Raw DB row (tags is bigint[])
export type ItemRow = typeof items.$inferSelect;
// Enriched domain model (tags replaced with objects)
// Domain Item: enrich tags; keep components as raw id[] for now (could be expanded later)
export type Item = Omit<ItemRow, 'tags' | 'components'> & { tags?: { id: number; name: string }[], components: number[] };
export type NewItem = typeof items.$inferInsert;
