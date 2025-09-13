import { getDb, persons, personTags, PersonStatus } from "@/lib/db/client";

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
