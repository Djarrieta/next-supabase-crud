name: "Scaffold New Domain Module"
description: "Generate a new CRUD module (schema, service, actions, page, dialogs) following the project conventions."

# You can call this from VS Code: Chat: Run Prompt -> Scaffold New Domain Module

# Variables can be supplied inline when running, or you'll be asked interactively.

args:

- name: module_name
  description: "Singular, lower-case feature name (e.g. item, order, customer)"
  required: true
- name: plural_name
  description: "Plural display label (e.g. Items, Orders). Defaults to module_name + 's'"
  required: false
- name: table_name
  description: "DB table name (snake_case). Defaults to plural of module_name (e.g. items)"
  required: false
- name: fields
  description: |
  Comma separated list of extra fields (excluding id, status, created_at, updated_at). Each field format:
  name:type[:options]
  Supported types: text, numeric(precision,scale), boolean, bigint, enum(a|b|c), json
  Examples: description:text, price:numeric(10,2), unique:boolean, category:enum(red|blue|green)
  required: false
- name: status_enum
  description: "Comma separated allowed lifecycle statuses (default: active,inactive,archived)"
  required: false
- name: with_tags
  description: "yes/no - include tag support like Items.tags (default: no)"
  required: false
- name: with_components
  description: "yes/no - include self-referencing components array like Items (default: no)"
  required: false

---

You are generating a new domain module for a Next.js + Drizzle + Supabase hybrid codebase.
Follow these architectural rules strictly:

ARCHITECTURE LAYERS (CURRENT CONVENTIONS)

1. Domain Schema (Drizzle): app/<plural>/schema.ts

- Pure pg-core + sql helpers only. No React/Next imports.
- Export: table, status enum (if any), status values constant, row & domain types.

2. Domain Service + Repository: app/<plural>/service.ts

- Two repository implementations (Drizzle & Supabase) auto-selected via env vars.
- Service exposes createFromForm, updateFromForm, softDeleteFromForm (if soft-delete), list, get.

3. Server Actions (Next.js): app/<plural>/actions.ts

- Thin wrappers calling service methods + revalidatePath.
- May include extra lightweight search helpers (see items/searchItemsForComponents pattern) when useful for selectors.

4. UI (list page + add dialog + detail page client):

- List route: app/<plural>/page.tsx (renders TableTemplate + Add dialog + filter input).
- Detail route: app/<plural>/[<singularId>]/page.tsx with a `<Singular>DetailClient` component in same folder for editing / archiving.
- Add dialog: app/<plural>/add-<module_name>-dialog.tsx (client component, uses shared Form primitives).
- Optional: filter utilities files (filter-utils.ts, use-<plural>-filters.ts) when the domain supports query filters.

5. Optional Tag Submodule (when with_tags = yes): app/<plural>/tags/

- schema.ts, service.ts, actions.ts, page.tsx, add-<singular>-tag-dialog.tsx (see items/tags example).

6. Central schema aggregator: lib/db/schema.ts (manual update – export new table, enums, and types).

RULE: NEVER import React/Next/UI inside schema or service modules (except next/cache in actions).

INPUT VARIABLES

- module_name: {{module_name}}
- plural_name: {{plural_name}}
- table_name: {{table_name}}
- fields: {{fields}}
- status_enum: {{status_enum}}
- with_tags: {{with_tags}}
- with_components: {{with_components}}

DERIVE DEFAULTS
If plural_name empty -> capitalize(module_name) + 's' for UI label and plural lower-case for folder name.
If table_name empty -> plural lower-case.
If status_enum empty -> active,inactive,archived.
If with_tags != yes -> omit tags array.
If with_components != yes -> omit components array.

OUTPUT EXACT STEPS SECTION first, then code blocks.

STEPS (produce as checklist markdown):

1. Create folder app/<plural_lower>/
2. Add schema.ts with pgTable definition including:

- id bigint identity primary key
- status enum (if statuses supplied) – enum name pattern: <module_name>\_status; constant: <MODULE_UPPER>\_STATUS_VALUES; exported pgEnum variable: <module_name>StatusEnum or <module_name>StatusEnum (follow items pattern: itemStatusEnum & ITEM_STATUS_VALUES)
- requested fields parsed from fields input (nullable by default unless type rule sets notNull)
- optional arrays (when flags enabled):
  - tags: bigint[] (NOT NULL default empty) – identical default: sql`'{}'::bigint[]`
  - components: bigint[] (self-referencing) – same default
- Avoid timestamps unless explicitly requested in fields list.

3. (If with_tags = yes) Create subfolder app/<plural_lower>/tags with schema.ts, service.ts, actions.ts, page.tsx, add-<module_name>-tag-dialog.tsx mirroring items/tags pattern (id + name, idempotent create, listAll).
4. Add service.ts implementing repositories:

- Drizzle + Supabase versions auto-selected via env var presence (DATABASE_URL or DRIZZLE_DATABASE_URL).
- Methods: create(name,...), update(id,...), list(filters,page,pageSize), get(id).
- Service wrapper exposing createFromForm, updateFromForm, softDeleteFromForm (sets status='archived' if status enum includes it, otherwise hard delete), list, get.
- Tag resolution + creation (if tags enabled) identical to items service (distinct names, create missing, store bigint[] ids).
- Component validation (if components enabled): remove duplicates & self, ensure existence, prevent cycles by walking ancestor graph (see items service BFS approach).

5. Add actions.ts exposing server actions: create<PascalSingular>, update<PascalSingular>, delete<PascalSingular> (soft), list<PascalPlural>, get<PascalSingular>. Revalidate list path and detail path (/<plural_lower> and /<plural_lower>/{id}). Include optional search helper if components enabled (pattern: search<PascalPlural>ForComponents(query, excludeIds, limit)).
6. Add page.tsx rendering TableTemplate (reference items/page.tsx) with columns: id, primary name/label field (show Badges-like summary if status/unique/tags/components exist), actions column linking to detail page.
7. Add add-<module_name>-dialog.tsx (client). No edit dialog: editing occurs on detail route.
8. Add detail route folder app/<plural_lower>/[<module_name>Id]/ containing page.tsx and <module_name>-detail-client.tsx. Client includes form for editing all fields + status selector + tags/components inputs (hidden markers `_tags_present` / `_components_present` when those arrays exist for selective update logic).
9. Add optional filter-utils.ts and use-<plural>-filters.ts if any list filters (status, ids, q/nameQuery, tagIds, unique, etc.) are relevant. Follow pattern from items module for parsing searchParams -> ItemsListFilters.
10. Update dashboard (app/page.tsx) by appending card linking to "/<plural_lower>" (see DASHBOARD UPDATE RULES below).
11. Update lib/db/schema.ts to export the new table, enum(s), constants, and types.
12. Run migration commands: bun drizzle:generate && bun drizzle:push
13. Add seed support: create scripts/seed/<plural_lower>.ts exporting seed<PascalPlural>(), import & invoke inside scripts/seed/index.ts. Then run: bun drizzle:seed
14. (If with_tags = yes) Document how to navigate to /<plural_lower>/tags for tag management (similar to /items/tags).

PARSING FIELDS
For each field spec name:type[:options]

- text => text('col')
- boolean => boolean('col').notNull().default(false)
- numeric(p,s) => numeric('col', { precision: p, scale: s }).notNull().default('0')
- bigint => bigint('col', { mode: 'number' })
- enum(a|b|c) => create local const VAR*VALUES = ['a','b','c'] as const; pgEnum('<module_name>*<field>\_enum', VAR_VALUES); column uses that enum
- json => json('col').$type<unknown>() (if pg json supported) else text fallback with comment
  All columns default nullable unless type rule above specifies notNull.

STATUS ENUM
If statuses equal default set, you may reuse existing item_status enum ONLY IF semantic meaning matches; otherwise create new one <module_name>\_status.
Assume we create a new enum to avoid coupling unless explicitly told to reuse.

SERVICE RULES

- createFromForm & updateFromForm mirror ItemsService style (extract + validate fields)
- list returns PaginatedResult<T>
- softDelete sets status to 'archived' if available else performs hard delete
- Validate numeric fields -> parseFloat; boolean -> presence or 'on'/'true'/'1'
- Tag logic only if tags array exists (replicate pattern from items service)
- Components logic only if components array exists (self-reference avoidance & ancestor cycle prevention similar to ItemsService)

ACTIONS RULES
Same pattern as app/items/actions.ts; keep try/catch + revalidatePath.

PAGE RULES

- Use TableTemplate.
- Provide description summarizing domain: "<Plural UI Label> management. Auto‑generated skeleton. Adjust columns, dialogs, filters, and domain rules as needed."
- Columns minimal default: id | primary text field (with badges summarizing status, uniqueness, counts) | actions (link to detail page). Expand as needed.
- Export `revalidate = 0` for always fresh data (matching current items module behavior) unless caching strategy differs.

DIALOG / DETAIL EDITING

- Add dialog handles create only.
- Detail page client component handles editing (status changes, tags/components, etc.) and archive (soft delete) action.
- Hidden markers `_tags_present` & `_components_present` are included in the edit form when those arrays exist so the service can detect intent to update them (mirrors items implementation).

DASHBOARD UPDATE RULES (app/page.tsx)

- Append (do not replace) a new object to the `cards` array with shape:
  {
  href: "/<plural_lower>",
  label: "<Plural UI Label>",
  description: "CRUD for your <plural_lower>.",
  icon: <<PascalPlural>Icon className="w-6 h-6" /> // or <PlaceholderIcon className="w-6 h-6" /> if no custom icon generated
  }
- Ensure import of the chosen icon in `app/page.tsx`. If generating a new icon component, add it under `components/icons.tsx` similar to existing ones.
- Avoid duplicates: if a card with same `href` already exists, skip adding.
- Keep existing ordering; new card can be appended at the end.

FINISHING OUTPUT FORMAT

1. Checklist
2. File tree (only new/changed paths)
3. Each file as a separate fenced code block with path comment // path: <path>
4. Post-generation commands section
5. Seed snippet section (MUST include: what seed file does, how to integrate new function, idempotency note, and example invocation)
6. Notes / next steps

Return only markdown; no extra explanation outside spec.
If user input insufficient, make reasonable assumptions and list them under Notes.

SEEDING RULES & CONTEXT (INCLUDE IN GENERATED OUTPUT):
The existing seed entrypoint (scripts/seed/index.ts) imports per-domain seed helpers (e.g. items.ts, persons.ts) and orchestrates inserting baseline lookup rows and bulk demo data. For a NEW MODULE you must:

1. Create an async function seed<PascalPlural>() in a new file: scripts/seed/<plural_lower>.ts (preferred) OR directly in scripts/seed/index.ts (fallback). Example: scripts/seed/customers.ts exporting seedCustomers.
2. Ensure idempotency: either check if any row exists before inserting OR use a WHERE NOT EXISTS pattern / ON CONFLICT DO NOTHING (if unique constraints defined). In Drizzle you can early-return after a count/select.
3. Limit volume by default (e.g., 25–100 rows) but parameterize a 'total' argument with a sensible default.
4. Return inserted (or existing) primary keys so later seed steps could reference them.
5. Import and append the invocation to main() in scripts/seed/index.ts in a clearly marked section (// New module seeds) after core dependencies (e.g., tags) are present.
6. If module uses tags/components arrays, ensure those dependencies are seeded first; pass resolved foreign key ids / tag ids into your generator.
7. KEEP seed functions deterministic when possible (e.g., sequential naming) but you may vary a couple fields for realism.
8. Document in the generated output EXACT diff to add to scripts/seed/index.ts:

- New seed file path & contents
- Import statement
- Call site inside main()

9. Provide a rerun workflow: to reset only this module's data, explain optional manual deletion (truncate table) then call its seed function.
10. Note performance considerations for large totals (batch inserts vs individual inserts; prefer single insert(values[...])))

Example pattern to emulate (adjust names):

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
