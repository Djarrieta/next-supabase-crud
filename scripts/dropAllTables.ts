// DANGEROUS: Drops all user tables in the public schema.
// Usage: bun run db:drop-all -- --force
// (The extra -- ensures arguments are passed when using some CLIs; with bun you can also just append --force)
// This script requires the --force flag to actually perform the drop.

import postgres from 'postgres';

function getConnectionString(): string {
  const cs = process.env.DRIZZLE_DATABASE_URL || process.env.DATABASE_URL;
  if (!cs) {
    console.error('Missing DRIZZLE_DATABASE_URL or DATABASE_URL environment variable.');
    process.exit(1);
  }
  return cs;
}

function assertForceFlag() {
  if (!process.argv.includes('--force')) {
    console.error('Refusing to drop tables. Re-run with --force to proceed.');
    process.exit(1);
  }
}

function warnIfLikelyProduction(conn: string) {
  // VERY naive heuristic. Adjust as desired.
  const lowered = conn.toLowerCase();
  if (/(prod|production)/.test(lowered)) {
    console.warn('\u26a0\ufe0f  Connection string contains "prod". Are you sure? Waiting 5s...');
    return new Promise<void>(res => setTimeout(res, 5000));
  }
  return Promise.resolve();
}

async function dropAll() {
  assertForceFlag();
  const connectionString = getConnectionString();
  await warnIfLikelyProduction(connectionString);

  const sql = postgres(connectionString, { max: 1 });
  try {
    console.log('Enumerating tables in public schema...');
    const tables = await sql<{ tablename: string }[]>`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;

    if (!tables.length) {
      console.log('No tables found. Nothing to drop.');
      return;
    }

    console.log(`Found ${tables.length} tables. Dropping (CASCADE)...`);
    // Use a DO block to drop all inside a transaction-like context.
    await sql`DO $$
    DECLARE r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END
    $$;`;

    console.log('All tables dropped.');
  } catch (err) {
    console.error('Error while dropping tables:', err);
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

// Execute if run directly.
if (require.main === module) {
  dropAll();
}
