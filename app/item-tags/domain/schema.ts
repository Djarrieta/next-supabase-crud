// itemTags table schema (feature-local, domain layer)
// Only Drizzle pg-core helpers & pure utilities. No React/Next/UI.

import { pgTable, bigint, text } from 'drizzle-orm/pg-core';
import { items } from '@/app/items/domain/schema';

export const itemTags = pgTable('item_tags', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  itemId: bigint('item_id', { mode: 'number' }).notNull().references(() => items.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
});

export type ItemTagRow = typeof itemTags.$inferSelect;
export type NewItemTagRow = typeof itemTags.$inferInsert;
