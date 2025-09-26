import { getDb, personTags, persons, PersonStatus } from '@/lib/db/client';

export async function seedPersonTags(total: number) {
  const db = getDb();
  const existing = await db.select({ id: personTags.id }).from(personTags).limit(1);
  if (existing.length) return existing.map(r => ({ id: r.id, name: `Existing-PersonTag-${r.id}` }));
  const tagNames = Array.from({ length: total }, (_, i) => `Person_Tag--${i + 1}`);
  return await db.insert(personTags).values(tagNames.map(name => ({ name }))).returning({ id: personTags.id, name: personTags.name });
}

export async function seedPersons(personTagRows: { id: number }[], total: number) {
  const db = getDb();
  const rows: any[] = [];
  for (let i = 0; i < total; i++) {
    const name = `Person ${i + 1}`;
    const status: PersonStatus = i === 0 ? 'archived' : i === 1 ? 'inactive' : 'active';
    const type = i % 5 === 0 ? 'legal' : 'natural';
    const allTagIds = personTagRows.map(t => t.id);
    // random subset of tags up to 3
    for (let j = allTagIds.length - 1; j > 0; j--) { const k = Math.floor(Math.random() * (j + 1));[allTagIds[j], allTagIds[k]] = [allTagIds[k], allTagIds[j]]; }
    const tagIds = allTagIds.slice(0, Math.min(3, allTagIds.length));
    rows.push({ name, status, type, tags: tagIds });
  }
  return await db.insert(persons).values(rows).returning({ id: persons.id });
}
