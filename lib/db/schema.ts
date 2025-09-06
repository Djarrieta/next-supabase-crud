import { pgTable, bigint, text } from 'drizzle-orm/pg-core';

export const items = pgTable('items', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  description: text('description'),
});

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
