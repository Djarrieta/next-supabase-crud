name: "Scaffold New Domain Module"
description: "Generate a new CRUD module (schema, service, actions, pages, dialogs, filters, optional tag sub-module, seeding) following the project conventions."

## Overview

You are generating a new domain module for a Next.js + Drizzle + Supabase hybrid codebase. Follow these architectural rules strictly.

# Variables can be supplied inline when running, or you'll be asked interactively.

You are generating a new domain module for a Next.js + Drizzle + Supabase hybrid codebase.
Follow these architectural rules strictly:

### Architecture Layers

1. Domain Schema (Drizzle): app/<plural>/schema.ts

- Define pgTable + pgEnum values (no business logic)
- Export value arrays (STATUS_VALUES) & union types
- Array relationship columns (tags/components) are bigint[] defaulting to empty array
- Export raw row + enriched domain model types

2. Service + Repository: app/<plural>/service.ts

- Service orchestrates forms & repo logic
- Interface <Singular>Repository; Drizzle & Supabase implementations
- Responsibilities: tag creation, component validation (no self/cycles), formatting, status transitions

3. Server Actions: app/<plural>/actions.ts (and tags/actions.ts)

- Thin wrappers, call service, revalidatePath

4. UI Pages

- List page: app/<plural>/page.tsx
- Detail page: app/<plural>/[<singularId>]/page.tsx
- Client detail/edit: app/<plural>/[<singularId>]/<singular>-detail-client.tsx

5. Dialogs

- Add entity dialog: app/<plural>/add-<singular>-dialog.tsx
- Tag add dialog: app/<plural>/tags/add-<singular>-tag-dialog.tsx (if tags)

6. Filters & Hooks

- filter-utils.ts + use-<plural>-filters.ts

7. Tag Sub-Module (if hasTags)

- tags/schema.ts, tags/service.ts, tags/actions.ts, tags/page.tsx, add-<singular>-tag-dialog.tsx, api route

8. Seeding Scripts: scripts/seed/<plural>.ts (idempotent)
9. Aggregated Schema Export: update lib/db/schema.ts
10. Reuse shared components (table-template, pagination-client, add-entity-dialog)

RULE: NEVER import React/Next/UI inside schema or service modules (except next/cache in actions).

### Input Variables

- singular (e.g. item)
- plural (e.g. items)
- hasTags (true/false)
- hasComponents (true/false)
- fields: [{ name, type, required, default?, description?, enumValues? }]
- statusValues? (default ['active','inactive','archived'])
- additionalEnums? ([{ name, values[] }])
- overwriteRequested? (boolean)

Derived: CapitalizedSingular, CapitalizedPlural, <singularId>

### Generated File Checklist

app/<plural>/schema.ts
app/<plural>/service.ts
app/<plural>/actions.ts
app/<plural>/page.tsx
app/<plural>/[<singularId>]/page.tsx
app/<plural>/[<singularId>]/<singular>-detail-client.tsx
app/<plural>/add-<singular>-dialog.tsx
app/<plural>/filter-utils.ts
app/<plural>/use-<plural>-filters.ts
scripts/seed/<plural>.ts
(if hasTags) app/<plural>/tags/schema.ts
(if hasTags) app/<plural>/tags/service.ts
(if hasTags) app/<plural>/tags/actions.ts
(if hasTags) app/<plural>/tags/page.tsx
(if hasTags) app/<plural>/tags/add-<singular>-tag-dialog.tsx
(if hasTags) app/api/<plural>/tags/route.ts
Update lib/db/schema.ts

### Schema Template

```ts
// app/<plural>/schema.ts
import { pgTable, bigint, text, boolean, numeric, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
export const <SINGULAR_UPPER>_STATUS_VALUES = <statusValuesLiteral> as const;
export type <CapitalizedSingular>Status = typeof <SINGULAR_UPPER>_STATUS_VALUES[number];
export const <singular>StatusEnum = pgEnum('<singular>_status', <SINGULAR_UPPER>_STATUS_VALUES);
<additionalEnumsBlocks>
export const <plural> = pgTable('<plural>', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  <dynamicFieldColumns>
  status: <singular>StatusEnum('status').notNull().default('<defaultStatus>'),
  <maybeTags>// bigint[] tag ids
  <maybeComponents>// bigint[] component ids
});
export type <CapitalizedSingular>StatusFilter = <CapitalizedSingular>Status | 'all';
export type <CapitalizedSingular>Row = typeof <plural>.$inferSelect;
export type <CapitalizedSingular> = <enrichedType>;
export type New<CapitalizedSingular> = typeof <plural>.$inferInsert;
```

### Service Template (excerpt)

```ts
// app/<plural>/service.ts
import { getSupabaseClient } from '@/lib/supabaseClient';
import { getDb, <plural><maybeTagImport> } from '@/lib/db/client';
import { and, eq, ilike, inArray, sql } from 'drizzle-orm';
import { <CapitalizedSingular>Status, <CapitalizedSingular>StatusFilter } from './schema';
export interface <CapitalizedSingular>Update { /* optional fields */ }
export interface PaginatedResult<T> { rows: T[]; total: number; page: number; pageSize: number }
export interface <CapitalizedPlural>ListFilters { status?: <CapitalizedSingular>StatusFilter; ids?: number[]; nameQuery?: string; <maybeFilterTags><maybeExtraFilters> }
export interface <CapitalizedSingular>Repository { create(/* fields */): Promise<void>; update(id:number, update:<CapitalizedSingular>Update): Promise<void>; list(filters:<CapitalizedPlural>ListFilters,page:number,pageSize:number): Promise<PaginatedResult<<CapitalizedSingular>>>; get(id:number): Promise<<CapitalizedSingular>|null>; }
export class <CapitalizedPlural>Service { constructor(private repo:<CapitalizedSingular>Repository) {} /* createFromForm / updateFromForm similar to items/persons */ }
```

### Server Action Template

```ts
'use server';
import { revalidatePath } from 'next/cache';
import { get<CapitalizedPlural>Service } from './service-factory';
export async function create<CapitalizedSingular>(fd: FormData){ const s = get<CapitalizedPlural>Service(); await s.createFromForm(fd); revalidatePath('/<plural>'); }
```

### Seed Script Template

```ts
// scripts/seed/<plural>.ts
import { getDb } from '@/lib/db/client';
import { <plural> } from '@/lib/db/schema';
export async function seed<CapitalizedPlural>(total=25){ const db=getDb(); const existing=await db.select({id:<plural>.id}).from(<plural>).limit(1); if(existing.length) return []; const rows=Array.from({length:total},(_,i)=>({ name:`<CapitalizedSingular>-${'${i+1}'}` })); return db.insert(<plural>).values(rows).returning({id:<plural>.id}); }
```

### Tags API Route (if hasTags)

```ts
// app/api/<plural>/tags/route.ts
import { NextResponse } from 'next/server';
import { getDb, <singular>Tags } from '@/lib/db/client';
export async function GET(){ const db=getDb(); const rows=await db.select().from(<singular>Tags).orderBy(<singular>Tags.name); return NextResponse.json(rows.map(r=>({ id:r.id, name:r.name }))); }
```

### Completion Checklist

[] Exported schema/enums in lib/db/schema.ts
[] Service & repositories
[] Server actions + revalidatePath
[] List & detail pages
[] Detail client component
[] Add dialog
[] Filters util + hook
[] Tag sub-module (if tags)
[] Tags API route (if tags)
[] Seed script + index registration
[] README update (optional)

```ts
// In scripts/seed/customers.ts
export async function seedCustomers(total = 25) {
  const db = getDb();
  const existing = await db
    .select({ id: customers.id })
    .from(customers)
    .limit(1);
  if (existing.length) {
    return [];
  } // idempotent: already seeded
  const rows = Array.from({ length: total }, (_, i) => ({
    name: `Customer-${i + 1}`,
    email: `customer${i + 1}@example.com`,
    vip: i % 10 === 0,
  }));
  return await db
    .insert(customers)
    .values(rows)
    .returning({ id: customers.id });
}
// Inside scripts/seed/index.ts main():
import { seedCustomers } from "./customers";
await seedCustomers(50);
```

When generating the NEW MODULE seed snippet, adapt to any extra fields & flags (tags/components) provided by the user input.

Return final answer as:

1. Summary table (path -> purpose)
2. File contents (plain)
3. Manual steps (aggregator export, migration)
