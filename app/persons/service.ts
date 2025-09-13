// Domain/service layer for Persons. Inspired by Items service but simplified.
// Responsibilities:
//  - Create/update persons with name, status, tags, components
//  - Resolve tag names -> tag ids (create missing)
//  - Validate components (no self, existing only, avoid ancestor cycles)

import { getSupabaseClient } from '@/lib/supabaseClient';
import { getDb, persons, personTags, PersonStatus, PERSON_STATUS_VALUES } from '@/lib/db/client';
import { eq, sql, inArray } from 'drizzle-orm';
import { PersonStatusFilter } from './schema';

export interface PersonUpdate { name?: string; status?: PersonStatus; tagNames?: string[]; componentIds?: number[] }
export interface PaginatedResult<T> { rows: T[]; total: number; page: number; pageSize: number }
export interface PersonRepository {
  create(name: string, tagNames: string[], componentIds: number[]): Promise<void>;
  update(id: number, update: PersonUpdate): Promise<void>;
  list(statusFilter: PersonStatusFilter, page: number, pageSize: number): Promise<PaginatedResult<any>>; // any -> enriched person
}

class DrizzlePersonRepository implements PersonRepository {
  async create(name: string, tagNames: string[], componentIds: number[]) {
    const db = getDb();
    await db.transaction(async (tx) => {
      const distinct = Array.from(new Set(tagNames.map(n => n.trim()).filter(Boolean)));
      let tagIds: number[] = [];
      if (distinct.length) {
        const existing = await tx.select().from(personTags).where(inArray(personTags.name, distinct));
        const map = new Map<string, number>(existing.map(r => [r.name || '', r.id as number]));
        const toCreate = distinct.filter(n => !map.has(n));
        if (toCreate.length) {
          const inserted = await tx.insert(personTags).values(toCreate.map(n => ({ name: n }))).returning({ id: personTags.id, name: personTags.name });
          inserted.forEach(r => map.set(r.name || '', r.id as number));
        }
        tagIds = distinct.map(n => map.get(n)!).filter(Boolean);
      }
      const compSet = new Set(componentIds.filter(id => Number.isInteger(id) && id > 0));
      let finalComponents: number[] = [];
      if (compSet.size) {
        const existing = await tx.select({ id: persons.id }).from(persons).where(inArray(persons.id, Array.from(compSet)));
        finalComponents = existing.map(r => r.id as number);
      }
      await tx.insert(persons).values({ name, tags: tagIds as any, components: finalComponents as any });
    });
  }
  async update(id: number, update: PersonUpdate) {
    if (!id || Number.isNaN(id)) throw new Error('Invalid person id');
    const db = getDb();
    await db.transaction(async (tx) => {
      const updateData: Record<string, unknown> = {};
      if (update.name !== undefined) updateData.name = update.name;
      if (update.status !== undefined) updateData.status = update.status;
      if (update.tagNames) {
        const distinct = Array.from(new Set(update.tagNames.map(n => n.trim()).filter(Boolean)));
        if (distinct.length) {
          const existing = await tx.select().from(personTags).where(inArray(personTags.name, distinct));
          const map = new Map<string, number>(existing.map(r => [r.name || '', r.id as number]));
          const toCreate = distinct.filter(n => !map.has(n));
          if (toCreate.length) {
            const inserted = await tx.insert(personTags).values(toCreate.map(n => ({ name: n }))).returning({ id: personTags.id, name: personTags.name });
            inserted.forEach(r => map.set(r.name || '', r.id as number));
          }
          updateData.tags = distinct.map(n => map.get(n)!).filter(Boolean) as any;
        } else {
          updateData.tags = [] as any;
        }
      }
      if (update.componentIds) {
        const raw = Array.from(new Set(update.componentIds.filter(v => Number.isInteger(v) && v > 0 && v !== id)));
        if (raw.length) {
          // detect ancestors to prevent cycles
          const ancestors = new Set<number>();
          const queue: number[] = [id];
          while (queue.length) {
            const current = queue.shift()!;
            const parents = await tx.select({ id: persons.id, components: persons.components }).from(persons).where(sql`${persons.components} @> ARRAY[${current}]::bigint[]`);
            for (const p of parents) {
              const pid = p.id as number;
              if (!ancestors.has(pid)) { ancestors.add(pid); queue.push(pid); }
            }
          }
          const filtered = raw.filter(cid => !ancestors.has(cid));
          let finalComponents: number[] = [];
          if (filtered.length) {
            const existing = await tx.select({ id: persons.id }).from(persons).where(inArray(persons.id, filtered));
            finalComponents = existing.map(r => r.id as number).filter(cid => !ancestors.has(cid));
          }
          updateData.components = finalComponents as any;
        } else {
          updateData.components = [] as any;
        }
      }
      if (Object.keys(updateData).length) await tx.update(persons).set(updateData).where(eq(persons.id, id));
    });
  }
  async list(statusFilter: PersonStatusFilter, page: number, pageSize: number): Promise<PaginatedResult<any>> {
    const db = getDb();
    const offset = (page - 1) * pageSize;
    const countQuery = statusFilter === 'all'
      ? db.select({ value: sql<number>`count(*)` }).from(persons)
      : db.select({ value: sql<number>`count(*)` }).from(persons).where(eq(persons.status, statusFilter));
    const [{ value: total }] = await countQuery;
    const baseRows = await (statusFilter === 'all'
      ? db.select().from(persons).orderBy(persons.id).limit(pageSize).offset(offset)
      : db.select().from(persons).where(eq(persons.status, statusFilter)).orderBy(persons.id).limit(pageSize).offset(offset));
    const allTagIds = Array.from(new Set(baseRows.flatMap(r => (r as any).tags as number[] || [])));
    const tagMapById = new Map<number, { id: number; name: string }>();
    if (allTagIds.length) {
      const tagRows = await db.select().from(personTags).where(inArray(personTags.id, allTagIds));
      tagRows.forEach(tr => { tagMapById.set(tr.id as number, { id: tr.id as number, name: tr.name || '' }); });
    }
    const mapped = baseRows.map(r => ({
      id: r.id as number,
      name: r.name ?? null,
      status: ((r as any).status || 'active') as PersonStatus,
      tags: ((r as any).tags || []).map((tid: number) => tagMapById.get(tid)).filter(Boolean),
      components: ((r as any).components || [])
    }));
    return { rows: mapped, total: Number(total) || 0, page, pageSize };
  }
}

class SupabasePersonRepository implements PersonRepository {
  async create(name: string, tagNames: string[], componentIds: number[]) {
    const supabase = getSupabaseClient();
    const distinct = Array.from(new Set(tagNames.map(n => n.trim()).filter(Boolean)));
    let tagIds: number[] = [];
    if (distinct.length) {
      const { data: existing, error: existingErr } = await supabase.from('person_tags').select('id, name').in('name', distinct);
      if (existingErr) throw existingErr;
      const map = new Map<string, number>((existing || []).map(r => [(r as any).name, (r as any).id]));
      const toCreate = distinct.filter(n => !map.has(n));
      if (toCreate.length) {
        const { data: inserted, error: insErr } = await supabase.from('person_tags').insert(toCreate.map(n => ({ name: n }))).select('id, name');
        if (insErr) throw insErr;
        (inserted || []).forEach(r => map.set((r as any).name, (r as any).id));
      }
      tagIds = distinct.map(n => map.get(n)!).filter(Boolean);
    }
    let finalComponents: number[] = [];
    if (componentIds.length) {
      const clean = Array.from(new Set(componentIds.filter(v => Number.isInteger(v) && v > 0)));
      if (clean.length) {
        const { data: existingComps, error: compsErr } = await supabase.from('persons').select('id').in('id', clean);
        if (compsErr) throw compsErr;
        finalComponents = (existingComps || []).map(r => (r as any).id);
      }
    }
    const { error } = await supabase.from('persons').insert({ name, tags: tagIds, components: finalComponents }).single();
    if (error) throw error;
  }
  async update(id: number, update: PersonUpdate) {
    if (!id || Number.isNaN(id)) throw new Error('Invalid person id');
    const supabase = getSupabaseClient();
    const updateData: Record<string, unknown> = {};
    if (update.name !== undefined) updateData.name = update.name;
    if (update.status !== undefined) updateData.status = update.status;
    if (update.tagNames) {
      const distinct = Array.from(new Set(update.tagNames.map(n => n.trim()).filter(Boolean)));
      let tagIds: number[] = [];
      if (distinct.length) {
        const { data: existing, error: existErr } = await supabase.from('person_tags').select('id, name').in('name', distinct);
        if (existErr) throw existErr;
        const map = new Map<string, number>((existing || []).map(r => [(r as any).name, (r as any).id]));
        const toCreate = distinct.filter(n => !map.has(n));
        if (toCreate.length) {
          const { data: inserted, error: insErr } = await supabase.from('person_tags').insert(toCreate.map(n => ({ name: n }))).select('id, name');
          if (insErr) throw insErr;
          (inserted || []).forEach(r => map.set((r as any).name, (r as any).id));
        }
        tagIds = distinct.map(n => map.get(n)!).filter(Boolean);
      }
      updateData.tags = tagIds;
    }
    if (update.componentIds) {
      const clean = Array.from(new Set(update.componentIds.filter(v => Number.isInteger(v) && v > 0 && v !== id)));
      let finalComponents: number[] = [];
      if (clean.length) {
        // Compute ancestors similarly to items approach (iterative up to depth 10)
        const ancestors = new Set<number>();
        let frontier: number[] = [id];
        for (let depth = 0; depth < 10 && frontier.length; depth++) {
          const { data: parentRows, error: parentErr } = await supabase.from('persons').select('id, components').filter('components', 'cs', `{${frontier.join(',')}}`);
          if (parentErr) throw parentErr;
          const next: number[] = [];
          (parentRows || []).forEach(r => {
            const pid = (r as any).id as number;
            if (!ancestors.has(pid)) { ancestors.add(pid); next.push(pid); }
          });
          frontier = next;
        }
        const safe = clean.filter(cid => !ancestors.has(cid));
        if (safe.length) {
          const { data: existingComps, error: compErr } = await supabase.from('persons').select('id').in('id', safe);
          if (compErr) throw compErr;
          finalComponents = (existingComps || []).map(r => (r as any).id).filter(cid => !ancestors.has(cid));
        }
      }
      updateData.components = finalComponents;
    }
    if (Object.keys(updateData).length) {
      const { error } = await supabase.from('persons').update(updateData).eq('id', id).single();
      if (error) throw error;
    }
  }
  async list(statusFilter: PersonStatusFilter, page: number, pageSize: number): Promise<PaginatedResult<any>> {
    const supabase = getSupabaseClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase
      .from('persons')
      .select('id, name, status, tags, components', { count: 'exact' })
      .order('id')
      .range(from, to);
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    const { data, error, count } = await query;
    if (error) throw error;
    const personsData = (data || []);
    const allTagIds = Array.from(new Set(personsData.flatMap(r => ((r as any).tags as number[]) || [])));
    const tagMapById = new Map<number, { id: number; name: string }>();
    if (allTagIds.length) {
      const { data: tagRows, error: tagErr } = await supabase.from('person_tags').select('id, name').in('id', allTagIds);
      if (tagErr) throw tagErr;
      (tagRows || []).forEach(tr => tagMapById.set((tr as any).id, { id: (tr as any).id, name: (tr as any).name }));
    }
    const mapped = personsData.map(r => ({
      id: (r as any).id as number,
      name: (r as any).name ?? null,
      status: ((r as any).status || 'active') as PersonStatus,
      tags: ((r as any).tags || []).map((tid: number) => tagMapById.get(tid)).filter(Boolean),
      components: ((r as any).components || [])
    }));
    return { rows: mapped, total: count || 0, page, pageSize };
  }
}

export class PersonsService {
  constructor(private repo: PersonRepository) {}
  async createFromForm(formData: FormData) {
    const name = String(formData.get('name') || '').trim() || 'Unnamed person';
    const tagNamesRaw = formData.getAll('tags').map(v => String(v)).filter(v => v.trim());
    const tagNames = Array.from(new Set(tagNamesRaw.map(v => v.trim())));
    const componentIdsRaw = formData.getAll('components').map(v => Number(v)).filter(v => Number.isInteger(v) && v > 0);
    const componentIds = Array.from(new Set(componentIdsRaw));
    await this.repo.create(name, tagNames, componentIds);
  }
  async updateFromForm(formData: FormData) {
    const id = this.extractId(formData);
    const name = String(formData.get('name') || '').trim() || 'Unnamed person';
    const rawStatus = String(formData.get('status') || 'active').trim();
    const status: PersonStatus = (PERSON_STATUS_VALUES as readonly string[]).includes(rawStatus) ? (rawStatus as PersonStatus) : 'active';
    let tagNames: string[] | undefined = undefined;
    if (formData.get('_tags_present')) {
      const tagNamesRaw2 = formData.getAll('tags').map(v => String(v)).filter(v => v.trim());
      tagNames = Array.from(new Set(tagNamesRaw2.map(v => v.trim())));
    }
    let componentIds: number[] | undefined = undefined;
    if (formData.get('_components_present')) {
      const rawComp = formData.getAll('components').map(v => Number(v)).filter(v => Number.isInteger(v) && v > 0);
      componentIds = Array.from(new Set(rawComp));
    }
    await this.repo.update(id, { name, status, tagNames, componentIds });
  }
  async softDeleteFromForm(formData: FormData) {
    const id = this.extractId(formData);
    await this.repo.update(id, { status: 'archived' });
  }
  async list(statusFilter: PersonStatusFilter, page: number, pageSize: number) {
    const allowed: PersonStatusFilter[] = ['active', 'inactive', 'archived', 'all'];
    const filter: PersonStatusFilter = allowed.includes(statusFilter) ? statusFilter : 'active';
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safePageSize = Number.isFinite(pageSize) && pageSize > 0 && pageSize <= 100 ? Math.floor(pageSize) : 10;
    return this.repo.list(filter, safePage, safePageSize);
  }
  private extractId(formData: FormData): number {
    const raw = formData.get('id');
    if (!raw) throw new Error('Missing person id');
    const id = Number(raw);
    if (Number.isNaN(id)) throw new Error('Invalid person id');
    return id;
  }
}

let _service: PersonsService | null = null;
export function getPersonsService(): PersonsService {
  if (!_service) {
    const useDrizzle = Boolean(process.env.DATABASE_URL || process.env.DRIZZLE_DATABASE_URL);
    _service = new PersonsService(useDrizzle ? new DrizzlePersonRepository() : new SupabasePersonRepository());
  }
  return _service;
}
