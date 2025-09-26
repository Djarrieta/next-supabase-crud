// Persons table schema.
// Similar to items but simplified: id, name, type (natural|legal), status, tags (array of person tag ids).
// No pricing, uniqueness, or components for now.
// Only Drizzle pg-core helpers here.

import { pgTable, bigint, text, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const PERSON_STATUS_VALUES = ['active', 'inactive', 'archived'] as const;
export type PersonStatus = typeof PERSON_STATUS_VALUES[number];
export const personStatusEnum = pgEnum('person_status', PERSON_STATUS_VALUES);

export const PERSON_TYPE_VALUES = ['natural', 'legal'] as const;
export type PersonType = typeof PERSON_TYPE_VALUES[number];
export const personTypeEnum = pgEnum('person_type', PERSON_TYPE_VALUES);

export const persons = pgTable('persons', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  type: personTypeEnum('type').notNull().default('natural'),
  status: personStatusEnum('status').notNull().default('active'),
  // Array of person tag ids (references person_tags.id). Maintained at service layer.
  tags: bigint('tags', { mode: 'number' }).array().notNull().default(sql`'{}'::bigint[]`),
});

export type PersonStatusFilter = PersonStatus | 'all';
export type PersonRow = typeof persons.$inferSelect;
export type Person = Omit<PersonRow, 'tags'> & { tags?: { id: number; name: string }[] };
export type NewPerson = typeof persons.$inferInsert;
