import { getDb, projects, persons } from '@/lib/db/client';
import type { ProjectStatus } from '@/app/projects/schema';

export async function seedProjects(total = 25) {
  const db = getDb();
  const existing = await db.select({ id: projects.id }).from(projects).limit(1);
  if (existing.length) return [];
  const personRows = await db.select({ id: persons.id }).from(persons).limit(100);
  if (!personRows.length) return [];
  const personIds = personRows.map(r => r.id as number);
  const rows = Array.from({ length: total }, (_, i) => {
    const status: ProjectStatus = i === 0 ? 'archived' : i === 1 ? 'inactive' : 'active';
    return { name: `Project-${i+1}`, description: `Project description ${i+1}`, status, personId: personIds[i % personIds.length] } as any;
  });
  return db.insert(projects).values(rows).returning({ id: projects.id });
}
