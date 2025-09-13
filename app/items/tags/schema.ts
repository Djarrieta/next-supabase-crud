// Item Tags table schema (feature-local, domain layer).
// Constraints: only Drizzle pg-core helpers & pure utilities. No React/Next/UI.
// To add new feature schemas: create app/<feature>/schema.ts and export via lib/db/schema.ts aggregator.

import { bigint, pgTable, text } from 'drizzle-orm/pg-core';

export const itemTags = pgTable('item_tags', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
});

export type ItemTagRow = typeof itemTags.$inferSelect;
export type NewItemTagRow = typeof itemTags.$inferInsert;
