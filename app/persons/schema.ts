// Persons table schema (feature-local, domain layer).
// Constraints: only Drizzle pg-core helpers & pure utilities. No React/Next/UI.
// To add new feature schemas: create app/<feature>/schema.ts and export via lib/db/schema.ts aggregator.

import { pgTable, bigint, text, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const PERSON_STATUS_VALUES = ['active', 'inactive', 'archived'] as const;
export type PersonStatus = typeof PERSON_STATUS_VALUES[number];
export const personStatusEnum = pgEnum('person_status', PERSON_STATUS_VALUES);

export const persons = pgTable('persons', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  name: text('name'),
  status: personStatusEnum('status').notNull().default('active'),
  // Array of tag ids (references person_tags.id). Maintained at service layer.
  tags: bigint('tags', { mode: 'number' }).array().notNull().default(sql`'{}'::bigint[]`),
  // Array of component person ids (self-referencing persons.id).
  components: bigint('components', { mode: 'number' }).array().notNull().default(sql`'{}'::bigint[]`),
});

export type PersonStatusFilter = PersonStatus | 'all';
export type PersonRow = typeof persons.$inferSelect;
export type Person = Omit<PersonRow, 'tags' | 'components'> & { tags?: { id: number; name: string }[], components: number[] };
export type NewPerson = typeof persons.$inferInsert;
