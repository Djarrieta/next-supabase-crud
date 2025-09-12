import { getDb, items, ItemTagRow, itemTags } from "@/lib/db/client";

export async function seedItemTags(total: number) {
  const db = getDb();
  const tagNames = Array.from({ length: total }, (_, i) => `Item_Tag--${i + 1}`);

  await db
    .insert(itemTags)
    .values(tagNames.map((name) => ({ name })))
    .onConflictDoNothing();

  const insertedTags = await db.select().from(itemTags);

  return insertedTags;
}

export async function seedItems(tagMap: ItemTagRow[], total: number) {
  const db = getDb();
  const insertedIds: number[] = [];
  for (let i = 0; i < total; i++) {
    const description = `Item--${i + 1}`;
    const status = i === 0 ? "archived" : i === 1 ? "inactive" : "active";
    const sellPrice = (100 + i * 10).toFixed(2); // simple increasing price
    const unique = i % 7 === 0; // every 7th is unique

    // Randomly pick between 1 and 4 tag IDs (without names), without duplicates
    const allTagIds = tagMap.map((t) => t.id);
    const desiredCount = Math.min(
      allTagIds.length,
      Math.floor(Math.random() * 4) + 1
    ); // 1..4 (bounded by available tags)

    // Simple Fisher–Yates shuffle for unbiased sampling
    for (let j = allTagIds.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [allTagIds[j], allTagIds[k]] = [allTagIds[k], allTagIds[j]];
    }
    const tagIds = allTagIds.slice(0, desiredCount);

    // Determine components only for every 10th item (1-based index divisible by 10)
    let componentIds: number[] = [];
    if ((i + 1) % 10 === 0) {
      // Pick up to the last 3 previously inserted item ids (or fewer if not enough)
      const lookback = insertedIds.slice(-3);
      componentIds = [...lookback];
    }

     await db
      .insert(items)
      .values({
        description,
        status,
        sellPrice,
        unique,
        tags: tagIds,
        components: componentIds,
      })
      .returning({ id: items.id });
  }
  return await db.select().from(items);
}

async function main() {
  const tagMap = await seedItemTags(5);
  await seedItems(tagMap, 100);

  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
