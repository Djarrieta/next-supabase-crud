// Simple seed script for development.
// Usage: bun run db:seed
// Ensures some baseline item tags and items exist.

import { getDb, items, itemTags } from '@/lib/db/client';
import { sql } from 'drizzle-orm';

async function main() {
  const db = getDb();

  const TOTAL_TAGS = 5;

  const tagsNames = Array.from({ length: TOTAL_TAGS }, (_, i) => `--Tag${i + 1}`);

  // Insert any missing tags (idempotent)
  await db.insert(itemTags)
    .values(tagsNames.map(name => ({ name })))
    .onConflictDoNothing();

  // Fetch tag catalog
  const tagRows = await db.select().from(itemTags);
  const tagMap = new Map(tagRows.map(r => [r.name, r.id] as const));

  // Build some demo items if table is empty (or very few rows)
  const existingCount = await db.execute<{ count: string }>(sql`select count(*)::text as count from items`);
  const count = parseInt(existingCount[0].count, 10);

  if (count < 5) {
    console.log(`Seeding demo items (current count: ${count})`);
    const sampleData = [
      { description: 'Standard Laptop', status: 'active', sellPrice: '899.99', unique: false, tags: ['Tag1', 'Tag2'] },
      { description: 'Consulting Package', status: 'active', sellPrice: '2500.00', unique: false, tags: ['Tag3', 'Tag4'] },
      { description: 'In-house CRM License', status: 'inactive', sellPrice: '0', unique: true, tags: ['Tag2', 'Tag5'] },
      { description: 'Premium Support Plan', status: 'active', sellPrice: '499.00', unique: false, tags: ['Tag3'] },
    ];

    for (const item of sampleData) {
      const tagIds = item.tags.map(t => tagMap.get(t)).filter(Boolean) as number[];
      await db.insert(items).values({
        description: item.description,
        status: item.status as any,
        sellPrice: item.sellPrice,
        unique: item.unique,
        tags: tagIds,
        components: [],
      });
    }
  } else {
    console.log('Items table already seeded; skipping item inserts.');
  }

  console.log('Seed complete.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
