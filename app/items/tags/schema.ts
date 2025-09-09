// itemTags table schema (feature-local, domain layer)
// Only Drizzle pg-core helpers & pure utilities. No React/Next/UI.

import { pgTable, bigint, text } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const itemTags = pgTable('item_tags', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
});

export type ItemTagRow = typeof itemTags.$inferSelect;
export type NewItemTagRow = typeof itemTags.$inferInsert;
