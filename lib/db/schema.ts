import { pgTable, bigint, text } from 'drizzle-orm/pg-core';

export const items = pgTable('items', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  description: text('description'),
  // Soft delete / lifecycle status: active | inactive | archived
  status: text('status').notNull().default('active'),
});

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
