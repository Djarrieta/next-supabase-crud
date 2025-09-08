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

// Reusable tag value list & enum (multi-valued field on items)
// NOTE: Keep ITEM_TAG_VALUES and pgEnum definition in sync if edited.
export const ITEM_TAG_VALUES = ['featured', 'clearance', 'seasonal', 'standard'] as const;
export type ItemTag = typeof ITEM_TAG_VALUES[number];
export const itemTagEnum = pgEnum('item_tag', ITEM_TAG_VALUES);

export const items = pgTable('items', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  description: text('description'),
  // Soft delete / lifecycle status: active | inactive | archived
  status: itemStatusEnum('status').notNull().default('active'),
  // Array of classification tags (enum item_tag[]). Defaults to empty array
  tags: itemTagEnum('tags').array().notNull().default(sql`'{}'::item_tag[]`),
  // Monetary sell price (stored as numeric(10,2)). Defaults to 0.00
  sellPrice: numeric('sell_price', { precision: 10, scale: 2 }).notNull().default('0'),
  // Whether the item is unique (boolean flag). Defaults to false
  unique: boolean('unique').notNull().default(false),
});

export type ItemStatusFilter = ItemStatus | 'all';
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
