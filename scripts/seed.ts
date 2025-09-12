import {
  getDb,
  items,
  ItemStatus,
  ItemTagRow,
  itemTags,
} from "@/lib/db/client";

async function main() {
  const itemTags = await seedItemTags(5);
  await seedItems(itemTags, 1000);

  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

export async function seedItemTags(total: number) {
  const db = getDb();
  const tagNames = Array.from(
    { length: total },
    (_, i) => `Item_Tag--${i + 1}`
  );

  return   await db
    .insert(itemTags)
    .values(tagNames.map((name) => ({ name })))
    .returning({id: itemTags.id, name: itemTags.name });
}

export async function seedItems(itemTags: ItemTagRow[], total: number) {
  const db = getDb();

  const rows = [];

  for (let i = 0; i < total; i++) {
    const description = `Item--${i + 1}`;
    const status: ItemStatus =
      i === 0 ? "archived" : i === 1 ? "inactive" : "active";
    const sellPrice = (100 + i * 10).toFixed(2);
    const unique = i % 7 === 0;

    // Tag selection
    const allTagIds = itemTags.map((t) => t.id);
    const desiredCount = Math.min(
      allTagIds.length,
      Math.floor(Math.random() * 4) + 1
    );
    for (let j = allTagIds.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [allTagIds[j], allTagIds[k]] = [allTagIds[k], allTagIds[j]];
    }
    const tagIds = allTagIds.slice(0, desiredCount);

    let componentIds: number[] = [];
    if ((i + 1) % 10 === 0) {
      // Reference up to 3 earlier ids
      componentIds = Array.from(
        { length: Math.min(3, i) },
        (_, idx) => i - idx
      ).filter((id) => id > 0);
    }

    rows.push({
      description,
      status,
      sellPrice,
      unique,
      tags: tagIds,
      components: componentIds,
    });
  }
  
  return await db.insert(items).values(rows).returning({ id: items.id , description: items.description  });
}


