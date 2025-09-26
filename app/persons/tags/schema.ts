// Person Tags schema (separate from item tags to avoid coupling domain semantics)
// Only id + name for now.
import { bigint, pgTable, text } from 'drizzle-orm/pg-core';

export const personTags = pgTable('person_tags', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
});

export type PersonTagRow = typeof personTags.$inferSelect;
export type NewPersonTagRow = typeof personTags.$inferInsert;
