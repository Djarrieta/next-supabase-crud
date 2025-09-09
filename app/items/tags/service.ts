// Domain/service layer for itemTags (simple name catalog)
// Keep pure domain + persistence orchestrations only.
// Forbidden imports: react, next/* (except server utilities), UI components.

import { getSupabaseClient } from '@/lib/supabaseClient';
import { getDb, itemTags, items } from '@/lib/db/client';
import { eq, sql, inArray } from 'drizzle-orm';
import type { ItemTagRow } from './schema';

export interface PaginatedResult<T> { rows: T[]; total: number; page: number; pageSize: number }
export interface ItemTagsRepository {
  list(page: number, pageSize: number): Promise<PaginatedResult<ItemTagRow>>;
  updateName(id: number, name: string): Promise<void>;
  delete(id: number): Promise<void>;
  create(name: string): Promise<void>;
  /** Return the full catalog of tags (id + name) without pagination. */
  listAll(): Promise<ItemTagRow[]>;
}

class DrizzleItemTagsRepository implements ItemTagsRepository {
  async list(page: number, pageSize: number): Promise<PaginatedResult<ItemTagRow>> {
    const db = getDb();
    const offset = (page - 1) * pageSize;
    const [{ value: total }] = await db.select({ value: sql<number>`count(*)` }).from(itemTags);
    const rows = await db.select().from(itemTags).orderBy(itemTags.id).limit(pageSize).offset(offset);
    return { rows: rows as ItemTagRow[], total: Number(total) || 0, page, pageSize };
  }
  async listAll(): Promise<ItemTagRow[]> {
    const db = getDb();
    const rows = await db.select().from(itemTags).orderBy(itemTags.name);
    return rows as ItemTagRow[];
  }
  async updateName(id: number, name: string): Promise<void> {
    const db = getDb();
    await db.update(itemTags).set({ name }).where(eq(itemTags.id, id));
  }
  async delete(id: number): Promise<void> {
    const db = getDb();
    await db.delete(itemTags).where(eq(itemTags.id, id));
  }
  async create(name: string): Promise<void> {
    const db = getDb();
    await db.insert(itemTags).values({ name });
  }
}

class SupabaseItemTagsRepository implements ItemTagsRepository {
  async list(page: number, pageSize: number): Promise<PaginatedResult<ItemTagRow>> {
    const supabase = getSupabaseClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await supabase
      .from('item_tags')
      .select('id, name', { count: 'exact' })
      .order('id')
      .range(from, to);
    if (error) throw error;
    return { rows: (data || []) as ItemTagRow[], total: count || 0, page, pageSize };
  }
  async listAll(): Promise<ItemTagRow[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('item_tags').select('id, name').order('name');
    if (error) throw error;
    return (data || []) as ItemTagRow[];
  }
  async updateName(id: number, name: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('item_tags').update({ name }).eq('id', id).single();
    if (error) throw error;
  }
  async delete(id: number): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('item_tags').delete().eq('id', id).single();
    if (error) throw error;
  }
  async create(name: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('item_tags').insert({ name }).single();
    if (error) throw error;
  }
}

export class ItemTagsService {
  constructor(private repo: ItemTagsRepository) {}
  async list(page: number, pageSize: number) {
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safePageSize = Number.isFinite(pageSize) && pageSize > 0 && pageSize <= 100 ? Math.floor(pageSize) : 10;
    return this.repo.list(safePage, safePageSize);
  }
  async listAll() {
    return this.repo.listAll();
  }
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

let _service: ItemTagsService | null = null;
export function getItemTagsService(): ItemTagsService {
  if (!_service) {
    const useDrizzle = Boolean(process.env.DATABASE_URL || process.env.DRIZZLE_DATABASE_URL);
    _service = new ItemTagsService(useDrizzle ? new DrizzleItemTagsRepository() : new SupabaseItemTagsRepository());
  }
  return _service;
}
