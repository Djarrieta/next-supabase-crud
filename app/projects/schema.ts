// Projects table schema.
// Fields: id, name, description, status, personId (FK -> persons.id)
// Only Drizzle pg-core helpers here. No React/Next imports.

import { pgTable, bigint, text, pgEnum } from 'drizzle-orm/pg-core';

export const PROJECT_STATUS_VALUES = ['active', 'inactive', 'archived'] as const;
export type ProjectStatus = typeof PROJECT_STATUS_VALUES[number];
export const projectStatusEnum = pgEnum('project_status', PROJECT_STATUS_VALUES);

export const projects = pgTable('projects', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  description: text('description'),
  status: projectStatusEnum('status').notNull().default('active'),
  personId: bigint('person_id', { mode: 'number' }).notNull(), // FK to persons.id (enforced via migration)
});

export type ProjectStatusFilter = ProjectStatus | 'all';
export type ProjectRow = typeof projects.$inferSelect;
export type Project = ProjectRow & { person?: { id: number; name: string } };
export type NewProject = typeof projects.$inferInsert;
