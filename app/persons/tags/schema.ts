// personTags table schema (feature-local, domain layer)
// Only Drizzle pg-core helpers & pure utilities. No React/Next/UI.

import { pgTable, bigint, text } from 'drizzle-orm/pg-core';

export const personTags = pgTable('person_tags', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
});

export type PersonTagRow = typeof personTags.$inferSelect;
export type NewPersonTagRow = typeof personTags.$inferInsert;
