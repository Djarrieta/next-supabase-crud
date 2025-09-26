// Persons service:
//  - Create / update persons (name, type, status, tags)
//  - Ensure tags exist (create missing)
//  - Soft delete via status = 'archived'
//  - Paginated listing with optional status & type filters & name substring
//  - Repository: Drizzle (if DB env vars) else Supabase client
import { getSupabaseClient } from '@/lib/supabaseClient';
import { getDb, persons, personTags, PERSON_STATUS_VALUES, PERSON_TYPE_VALUES } from '@/lib/db/client';
import { and, eq, ilike, inArray, sql } from 'drizzle-orm';
import type { Person, PersonStatus } from '@/app/persons/schema';

export interface PersonUpdate { name?: string; status?: PersonStatus; type?: string; tagNames?: string[] }
export interface PaginatedResult<T> { rows: T[]; total: number; page: number; pageSize: number }
export interface PersonsListFilters {
  status?: string; // 'all' means ignore
  ids?: number[];
  nameQuery?: string;
  tagIds?: number[]; // AND filter
  type?: string; // natural | legal
}

export interface PersonRepository {
  create(name: string, type: string, tagNames: string[]): Promise<void>;
  update(id: number, update: PersonUpdate): Promise<void>;
  list(filters: PersonsListFilters, page: number, pageSize: number): Promise<PaginatedResult<Person>>;
  get(id: number): Promise<Person | null>;
}

class DrizzlePersonRepository implements PersonRepository {
  async create(name: string, type: string, tagNames: string[]) {
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
      await tx.insert(persons).values({ name, type: type as any, tags: tagIds as any }).returning({ id: persons.id });
    });
  }
  async update(id: number, update: PersonUpdate) {
    const db = getDb();
    await db.transaction(async (tx) => {
      const updateData: Record<string, unknown> = {};
      if (update.name !== undefined) updateData.name = update.name;
      if (update.status !== undefined) updateData.status = update.status;
      if (update.type !== undefined) updateData.type = update.type;
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
      if (Object.keys(updateData).length) await tx.update(persons).set(updateData).where(eq(persons.id, id));
    });
  }
  async list(filters: PersonsListFilters, page: number, pageSize: number): Promise<PaginatedResult<Person>> {
    const db = getDb();
    const offset = (page - 1) * pageSize;
    const whereClauses: any[] = [];
    if (filters.status && filters.status !== 'all') whereClauses.push(eq(persons.status, filters.status as any));
    if (filters.ids && filters.ids.length) whereClauses.push(inArray(persons.id, filters.ids));
    if (filters.nameQuery) whereClauses.push(ilike(persons.name, `%${filters.nameQuery}%`));
    if (filters.type && PERSON_TYPE_VALUES.includes(filters.type as any)) whereClauses.push(eq(persons.type, filters.type as any));
    if (filters.tagIds && filters.tagIds.length) {
      for (const tid of filters.tagIds) {
        whereClauses.push(sql`${persons.tags} @> ARRAY[${tid}]::bigint[]`);
      }
    }
    const whereExpr = whereClauses.length ? and(...whereClauses) : undefined;
    const countQuery = whereExpr ? db.select({ value: sql<number>`count(*)` }).from(persons).where(whereExpr) : db.select({ value: sql<number>`count(*)` }).from(persons);
    const [{ value: total }] = await countQuery;
    const baseRows = whereExpr
      ? await db.select().from(persons).where(whereExpr).orderBy(persons.id).limit(pageSize).offset(offset)
      : await db.select().from(persons).orderBy(persons.id).limit(pageSize).offset(offset);
    const allTagIds = Array.from(new Set(baseRows.flatMap(r => (r as any).tags as number[] || [])));
    const tagMap = new Map<number, { id: number; name: string }>();
    if (allTagIds.length) {
      const tagRows = await db.select().from(personTags).where(inArray(personTags.id, allTagIds));
      tagRows.forEach(tr => tagMap.set(tr.id as number, { id: tr.id as number, name: tr.name || '' }));
    }
    const mapped = baseRows.map(r => ({
      id: r.id as number,
      name: (r as any).name || '',
      type: (r as any).type,
      status: (r as any).status,
      tags: ((r as any).tags || []).map((tid: number) => tagMap.get(tid)).filter(Boolean),
    })) as Person[];
    return { rows: mapped, total: Number(total) || 0, page, pageSize };
  }
  async get(id: number): Promise<Person | null> {
    const db = getDb();
    const rows = await db.select().from(persons).where(eq(persons.id, id)).limit(1);
    if (!rows.length) return null;
    const row: any = rows[0];
    const tagIds: number[] = Array.isArray(row.tags) ? row.tags : [];
    let tagsResolved: { id: number; name: string }[] = [];
    if (tagIds.length) {
      const tagRows = await db.select().from(personTags).where(inArray(personTags.id, tagIds));
      tagsResolved = tagRows.map(tr => ({ id: tr.id as number, name: tr.name || '' }));
    }
    return { id: row.id as number, name: row.name || '', type: row.type, status: row.status, tags: tagsResolved } as Person;
  }
}

class SupabasePersonRepository implements PersonRepository {
  async create(name: string, type: string, tagNames: string[]) {
    const supabase = getSupabaseClient();
    const distinct = Array.from(new Set(tagNames.map(n => n.trim()).filter(Boolean)));
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
    const { error } = await supabase.from('persons').insert({ name, type, tags: tagIds }).single();
    if (error) throw error;
  }
  async update(id: number, update: PersonUpdate) {
    const supabase = getSupabaseClient();
    const updateData: Record<string, unknown> = {};
    if (update.name !== undefined) updateData.name = update.name;
    if (update.status !== undefined) updateData.status = update.status;
    if (update.type !== undefined) updateData.type = update.type;
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
    if (Object.keys(updateData).length) {
      const { error } = await supabase.from('persons').update(updateData).eq('id', id).single();
      if (error) throw error;
    }
  }
  async list(filters: PersonsListFilters, page: number, pageSize: number): Promise<PaginatedResult<Person>> {
    const supabase = getSupabaseClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase.from('persons').select('id, name, type, status, tags', { count: 'exact' }).order('id').range(from, to);
    if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
    if (filters.ids && filters.ids.length) query = query.in('id', filters.ids);
    if (filters.nameQuery) query = query.ilike('name', `%${filters.nameQuery}%`);
    if (filters.type && PERSON_TYPE_VALUES.includes(filters.type as any)) query = query.eq('type', filters.type);
    if (filters.tagIds && filters.tagIds.length) query = query.contains('tags', filters.tagIds);
    const { data, error, count } = await query;
    if (error) throw error;
    const personsData = (data || []);
    let tagMap = new Map<number, { id: number; name: string }>();
    const allTagIds = Array.from(new Set(personsData.flatMap(r => ((r as any).tags as number[]) || [])));
    if (allTagIds.length) {
      const { data: tagRows, error: tagErr } = await supabase.from('person_tags').select('id, name').in('id', allTagIds);
      if (tagErr) throw tagErr;
      (tagRows || []).forEach(tr => tagMap.set((tr as any).id, { id: (tr as any).id, name: (tr as any).name }));
    }
    const mapped = personsData.map(r => ({ id: (r as any).id as number, name: (r as any).name || '', type: (r as any).type, status: (r as any).status, tags: ((r as any).tags || []).map((tid: number) => tagMap.get(tid)).filter(Boolean) })) as Person[];
    return { rows: mapped, total: count || 0, page, pageSize };
  }
  async get(id: number): Promise<Person | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('persons').select('id, name, type, status, tags').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const tagIds: number[] = Array.isArray((data as any).tags) ? (data as any).tags : [];
    let tagsResolved: { id: number; name: string }[] = [];
    if (tagIds.length) {
      const { data: tagRows, error: tagErr } = await supabase.from('person_tags').select('id, name').in('id', tagIds);
      if (tagErr) throw tagErr;
      tagsResolved = (tagRows || []).map(r => ({ id: (r as any).id, name: (r as any).name }));
    }
    return { id: (data as any).id as number, name: (data as any).name || '', type: (data as any).type, status: (data as any).status, tags: tagsResolved } as Person;
  }
}

export class PersonsService {
  constructor(private repo: PersonRepository) { }
  async createFromForm(formData: FormData) {
    const name = String(formData.get('name') || '').trim() || 'Unnamed';
    const typeRaw = String(formData.get('type') || 'natural').trim();
    const type = (PERSON_TYPE_VALUES as readonly string[]).includes(typeRaw) ? typeRaw : 'natural';
    const tagNamesRaw = formData.getAll('tags').map(v => String(v)).filter(v => v.trim());
    const tagNames = Array.from(new Set(tagNamesRaw.map(v => v.trim())));
    await this.repo.create(name, type, tagNames);
  }
  async updateFromForm(formData: FormData) {
    const id = this.extractId(formData);
    const name = formData.get('name') != null ? String(formData.get('name') || '').trim() : undefined;
    const rawStatus = String(formData.get('status') || 'active').trim();
    const status: PersonStatus = (PERSON_STATUS_VALUES as readonly string[]).includes(rawStatus) ? (rawStatus as PersonStatus) : 'active';
    const typeRaw = String(formData.get('type') || '').trim();
    const type = typeRaw ? ((PERSON_TYPE_VALUES as readonly string[]).includes(typeRaw) ? typeRaw : undefined) : undefined;
    let tagNames: string[] | undefined = undefined;
    if (formData.get('_tags_present')) {
      const tagNamesRaw2 = formData.getAll('tags').map(v => String(v)).filter(v => v.trim());
      tagNames = Array.from(new Set(tagNamesRaw2.map(v => v.trim())));
    }
    await this.repo.update(id, { name, status, type, tagNames });
  }
  async softDeleteFromForm(formData: FormData) {
    const id = this.extractId(formData);
    await this.repo.update(id, { status: 'archived' as any });
  }
  async list(filters: PersonsListFilters, page: number, pageSize: number) {
    const allowedStatus = ['active', 'inactive', 'archived', 'all'];
    const status = filters.status && allowedStatus.includes(filters.status) ? filters.status : filters.status ? 'active' : undefined;
    const ids = (filters.ids || []).filter(v => Number.isInteger(v) && v > 0);
    const nameQuery = (filters.nameQuery || '').trim() || undefined;
    const type = filters.type && PERSON_TYPE_VALUES.includes(filters.type as any) ? filters.type : undefined;
    const tagIds = (filters.tagIds || []).filter(v => Number.isInteger(v) && v > 0);
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safePageSize = Number.isFinite(pageSize) && pageSize > 0 && pageSize <= 100 ? Math.floor(pageSize) : 10;
    return this.repo.list({ status, ids, nameQuery, tagIds, type }, safePage, safePageSize);
  }
  async get(id: number) { return this.repo.get(id); }
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
