# next-supabase-crud

Minimal Next.js (App Router) + Supabase + shadcn/ui example using Bun.

## Stack

- Next.js 14 App Router
- Bun (no npm)
- Supabase JS v2
- TailwindCSS + shadcn/ui (only Table component included manually)
- Drizzle ORM (Postgres / Supabase)

## Setup

1. Copy env file:

```bash
cp .env.example .env.local
```

2. Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project.
3. Ensure your Supabase has a table `items`:

```sql
create table if not exists public.items (
  id bigint generated always as identity primary key,
  description text
);
insert into items (description) values ('First'), ('Second') on conflict do nothing;
```

4. Install deps with Bun:

```bash
bun install
```

5. Run dev server:

```bash
bun run dev
```

6. Open http://localhost:3000

## Notes

- Data is fetched server-side on each request (`revalidate = 0`).
- Only a simple read (list) is implemented.
- Add more shadcn components by installing the CLI (optional): `bunx shadcn-ui add button`.

## Drizzle ORM

This project includes Drizzle for managing schema & migrations locally against your Supabase Postgres database.

1. Set a `DATABASE_URL` (or `DRIZZLE_DATABASE_URL`) in `.env.local`. You can copy the pooled connection string from Supabase (Settings > Database > Connection string > URI). It looks like:

```
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@aws-xyz.supabase.co:5432/postgres
```

2. Define feature tables in `app/<feature>/schema.ts` (e.g. `app/items/schema.ts`). Then export them from the central aggregator `lib/db/schema.ts` so Drizzle sees a single schema entry point.
3. Generate SQL migrations:

```bash
bun run drizzle:generate
```

4. Push (apply) them to the database (uses the connection string):

```bash
bun run drizzle:push
```

5. (Optional) Open the Drizzle Studio UI:

```bash
bun run drizzle:studio
```

`drizzle/` output is gitignored by default; remove the entry from `.gitignore` if you wish to commit migration snapshots.

### Seeding Data (Development)

There's a simple idempotent seed script that inserts a baseline tag catalog and a few demo items (only if fewer than 5 items exist).

Run it after running migrations:

```bash
bun run db:seed
```

What it does:

- Ensures tag names: hardware, software, service, internal, external
- Inserts 4 sample items if the table is nearly empty
- Skips inserting items if you already have 5+ rows

Feel free to edit `scripts/seed.ts` to adjust sample data. Re-running won't duplicate tags or exceed the initial sample item set (it only seeds when item count < 5).

### Tag Model Refactor (Catalog + Array)

The tag system has been refactored from per-item tag rows to a global catalog:

- `item_tags` now only contains `id` and `name` (unique by name).
- `items` has a new `tags bigint[]` column storing tag ids.
- Creating/updating an item resolves tag names to ids (creating missing catalog entries) and persists the array.
- UI for managing tags is now independent of items (global list).

Migration `0001_tag_catalog_refactor.sql` reshapes existing data. Previous per-item associations are not automatically backfilled into the new array (since the old linking rows are collapsed by name). Reassign tags to items as needed after migration.

### Breadcrumbs

The project wraps the shadcn/ui breadcrumb primitives with a simple API: `components/breadcrumb.tsx` exposing `<Breadcrumb items={[{ label, href? }, ...]} />`.

Usage example:

```tsx
<Breadcrumb
  items={[
    { label: "Home", href: "/" },
    { label: "Items", href: "/items" },
    { label: "Tags" }, // last item (no href) is the current page
  ]}
/>
```

Rules:

- Provide `href` for navigable intermediate crumbs.
- Omit `href` (or set undefined) for the final crumb to render the current page style.
- Pass a custom separator via the optional `separator` prop if you don't want the default chevron.

If you later need automatic generation from the current pathname, you can extend the wrapper to derive `items` from `usePathname()` and a label map.
