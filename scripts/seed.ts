import { getDb, items, ItemStatus, ItemTagRow, itemTags, persons, personTags, PersonStatus } from "@/lib/db/client";

async function main() {
  // Seeds itemTags and items
  const seededItemTags = await seedItemTags(5);
  await seedItems(seededItemTags, 1000);
  
  // Seeds personTags and persons
  const personTagRows = await seedPersonTags(5);
  await seedPersons(personTagRows, 200);
  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

export async function seedItemTags(total: number) {
  const db = getDb();
  const existing = await db.select({ id: itemTags.id }).from(itemTags).limit(1);
  if (existing.length) return existing.map((r) => ({ id: r.id, name: `Existing-ItemTag-${r.id}` }));
  const tagNames = Array.from({ length: total }, (_, i) => `Item_Tag--${i + 1}`);
  return await db
    .insert(itemTags)
    .values(tagNames.map((name) => ({ name })))
    .returning({ id: itemTags.id, name: itemTags.name });
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

export async function seedPersonTags(total: number) {
  const db = getDb();
  const existing = await db.select({ id: personTags.id }).from(personTags).limit(1);
  if (existing.length) return [] as { id: number; name: string }[]; // idempotent
  const tagNames = Array.from({ length: total }, (_, i) => `Person_Tag--${i + 1}`);
  return await db
    .insert(personTags)
    .values(tagNames.map((name) => ({ name })))
    .returning({ id: personTags.id, name: personTags.name });
}

export async function seedPersons(personTagsInput: { id: number; name: string }[], total: number) {
  const db = getDb();
  const existing = await db.select({ id: persons.id }).from(persons).limit(1);
  if (existing.length) return [] as { id: number }[]; // idempotent

  const allTagIds = personTagsInput.map((t) => t.id);
  const rows = Array.from({ length: total }, (_, i) => {
    const name = `Person--${i + 1}`;
    const status: PersonStatus = i === 0 ? 'archived' : i === 1 ? 'inactive' : 'active';

    // pick 0-3 tag ids shuffled
    const desiredCount = Math.min(allTagIds.length, Math.floor(Math.random() * 4));
    const shuffled = [...allTagIds];
    for (let j = shuffled.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [shuffled[j], shuffled[k]] = [shuffled[k], shuffled[j]];
    }
    const tagIds = shuffled.slice(0, desiredCount);

    // components: reference earlier ids in a simple pattern
    const components: number[] = [];
    if ((i + 1) % 15 === 0) {
      for (let c = Math.max(0, i - 3); c < i; c++) {
        components.push(c + 1); // earlier person ids
      }
    }

    return { name, status, tags: tagIds, components };
  });

  return await db.insert(persons).values(rows).returning({ id: persons.id });
}


