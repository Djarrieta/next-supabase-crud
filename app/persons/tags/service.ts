// Person tags service:
//  - CRUD tag names (id, name)
//  - Paginated listing + listAll() full catalog
//  - Normalizes blank names -> 'unnamed'
//  - Repository: Drizzle (if DB env vars) else Supabase client

import { getDb, personTags } from '@/lib/db/client';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { eq, sql } from 'drizzle-orm';
import type { PersonTagRow } from './schema';

export interface PaginatedResult<T> { rows: T[]; total: number; page: number; pageSize: number }
export interface PersonTagsRepository {
  list(page: number, pageSize: number): Promise<PaginatedResult<PersonTagRow>>;
  updateName(id: number, name: string): Promise<void>;
  delete(id: number): Promise<void>;
  create(name: string): Promise<void>;
  listAll(): Promise<PersonTagRow[]>;
}

class DrizzlePersonTagsRepository implements PersonTagsRepository {
  async list(page: number, pageSize: number): Promise<PaginatedResult<PersonTagRow>> {
    const db = getDb();
    const offset = (page - 1) * pageSize;
    const [{ value: total }] = await db.select({ value: sql<number>`count(*)` }).from(personTags);
    const rows = await db.select().from(personTags).orderBy(personTags.id).limit(pageSize).offset(offset);
    return { rows: rows as PersonTagRow[], total: Number(total) || 0, page, pageSize };
  }
  async listAll(): Promise<PersonTagRow[]> {
    const db = getDb();
    const rows = await db.select().from(personTags).orderBy(personTags.name);
    return rows as PersonTagRow[];
  }
  async updateName(id: number, name: string): Promise<void> {
    const db = getDb();
    await db.update(personTags).set({ name }).where(eq(personTags.id, id));
  }
  async delete(id: number): Promise<void> {
    const db = getDb();
    await db.delete(personTags).where(eq(personTags.id, id));
  }
  async create(name: string): Promise<void> {
    const db = getDb();
    await db.insert(personTags).values({ name });
  }
}

class SupabasePersonTagsRepository implements PersonTagsRepository {
  async list(page: number, pageSize: number): Promise<PaginatedResult<PersonTagRow>> {
    const supabase = getSupabaseClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await supabase
      .from('person_tags')
      .select('id, name', { count: 'exact' })
      .order('id')
      .range(from, to);
    if (error) throw error;
    return { rows: (data || []) as PersonTagRow[], total: count || 0, page, pageSize };
  }
  async listAll(): Promise<PersonTagRow[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('person_tags').select('id, name').order('name');
    if (error) throw error;
    return (data || []) as PersonTagRow[];
  }
  async updateName(id: number, name: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('person_tags').update({ name }).eq('id', id).single();
    if (error) throw error;
  }
  async delete(id: number): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('person_tags').delete().eq('id', id).single();
    if (error) throw error;
  }
  async create(name: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('person_tags').insert({ name }).single();
    if (error) throw error;
  }
}

export class PersonTagsService {
  constructor(private repo: PersonTagsRepository) {}
  async list(page: number, pageSize: number) {
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safePageSize = Number.isFinite(pageSize) && pageSize > 0 && pageSize <= 100 ? Math.floor(pageSize) : 10;
    return this.repo.list(safePage, safePageSize);
  }
  async listAll() { return this.repo.listAll(); }
  async updateFromForm(formData: FormData) {
    const id = this.extractId(formData);
    const rawName = String(formData.get('name') || '').trim();
    const name = rawName || 'unnamed';
    await this.repo.updateName(id, name);
  }
  async deleteFromForm(formData: FormData) {
    const id = this.extractId(formData);
    await this.repo.delete(id);
  }
  async createFromForm(formData: FormData) {
    const rawName = String(formData.get('name') || '').trim();
    const name = rawName || 'unnamed';
    await this.repo.create(name);
  }
  private extractId(formData: FormData): number {
    const raw = formData.get('id');
    if (!raw) throw new Error('Missing tag id');
    const id = Number(raw);
    if (Number.isNaN(id)) throw new Error('Invalid tag id');
    return id;
  }
}

let _service: PersonTagsService | null = null;
export function getPersonTagsService(): PersonTagsService {
  if (!_service) {
    const useDrizzle = Boolean(process.env.DATABASE_URL || process.env.DRIZZLE_DATABASE_URL);
    _service = new PersonTagsService(useDrizzle ? new DrizzlePersonTagsRepository() : new SupabasePersonTagsRepository());
  }
  return _service;
}
