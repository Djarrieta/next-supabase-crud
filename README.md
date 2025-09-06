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

2. Define tables in `lib/db/schema.ts`.
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
