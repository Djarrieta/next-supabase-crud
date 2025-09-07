// Domain/service layer for Items.
// Keep pure domain + persistence orchestrations only.
// Forbidden imports: react, next/* (except server-only utilities if truly infra), any UI/components, app/* outside domain folders.
// Allowed: lib/db, lib/supabaseClient, other domain modules, value objects, utilities.

import { getSupabaseClient } from '@/lib/supabaseClient';
import { getDb, Item, items } from '@/lib/db/client';
import { eq, sql } from 'drizzle-orm';

export interface ItemUpdate { description?: string; status?: string }
export interface PaginatedResult<T> { rows: T[]; total: number; page: number; pageSize: number }
export interface ItemRepository {
  create(description: string): Promise<void>;
  update(id: number, update: ItemUpdate): Promise<void>;
  list(statusFilter: string, page: number, pageSize: number): Promise<PaginatedResult<Item>>;
}

class DrizzleItemRepository implements ItemRepository {
  async create(description: string) {
    await getDb().insert(items).values({ description });
  }
  async update(id: number, update: ItemUpdate) {
    if (!id || Number.isNaN(id)) throw new Error('Invalid item id');
    const updateData: Record<string, unknown> = {};
    if (update.description !== undefined) updateData.description = update.description;
    if (update.status !== undefined) updateData.status = update.status;
    if (Object.keys(updateData).length === 0) return;
    await getDb().update(items).set(updateData).where(eq(items.id, id));
  }
  async list(statusFilter: string, page: number, pageSize: number): Promise<PaginatedResult<Item>> {
    const db = getDb();
    const offset = (page - 1) * pageSize;
    // total count
    const countQuery = statusFilter === 'all'
      ? db.select({ value: sql<number>`count(*)` }).from(items)
      : db.select({ value: sql<number>`count(*)` }).from(items).where(eq(items.status, statusFilter));
    const [{ value: total }] = await countQuery;
    const pageRows = await (statusFilter === 'all'
      ? db.select().from(items).orderBy(items.id).limit(pageSize).offset(offset)
      : db.select().from(items).where(eq(items.status, statusFilter)).orderBy(items.id).limit(pageSize).offset(offset));
    const mapped = pageRows.map(r => ({ id: r.id as number, description: r.description ?? null, status: (r as any).status || 'active' }));
    return { rows: mapped, total: Number(total) || 0, page, pageSize };
  }
}

class SupabaseItemRepository implements ItemRepository {
  async create(description: string) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('items').insert({ description });
    if (error) throw error;
  }
  async update(id: number, update: ItemUpdate) {
    if (!id || Number.isNaN(id)) throw new Error('Invalid item id');
    const updateData: Record<string, unknown> = {};
    if (update.description !== undefined) updateData.description = update.description;
    if (update.status !== undefined) updateData.status = update.status;
    if (Object.keys(updateData).length === 0) return;
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('items')
      .update(updateData)
      .eq('id', id)
      .single();
    if (error) throw error;
  }
  async list(statusFilter: string, page: number, pageSize: number): Promise<PaginatedResult<Item>> {
    const supabase = getSupabaseClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase
      .from('items')
      .select('id, description, status', { count: 'exact' })
      .order('id')
      .range(from, to);
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    const { data, error, count } = await query;
    if (error) throw error;
    const mapped = (data || []).map(r => ({ id: (r as any).id as number, description: (r as any).description ?? null, status: (r as any).status || 'active' }));
    return { rows: mapped, total: count || 0, page, pageSize };
  }
}

export class ItemsService {
  constructor(private repo: ItemRepository) {}
  async createFromForm(formData: FormData) {
    const description = String(formData.get('description') || '').trim();
    const finalDescription = description || 'Untitled item';
    await this.repo.create(finalDescription);
  }
  async updateFromForm(formData: FormData) {
    const id = this.extractId(formData);
    const description = String(formData.get('description') || '').trim();
    const status = String(formData.get('status') || 'active').trim();
    const finalDescription = description || 'Untitled item';
    await this.repo.update(id, { description: finalDescription, status });
  }
  async softDeleteFromForm(formData: FormData) {
    const id = this.extractId(formData);
    await this.repo.update(id, { status: 'archived' });
  }
  async list(statusFilter: string, page: number, pageSize: number) {
    const allowed = ['active', 'inactive', 'all'];
    const filter = allowed.includes(statusFilter) ? statusFilter : 'active';
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safePageSize = Number.isFinite(pageSize) && pageSize > 0 && pageSize <= 100 ? Math.floor(pageSize) : 10;
    return this.repo.list(filter, safePage, safePageSize);
  }
  private extractId(formData: FormData): number {
    const raw = formData.get('id');
    if (!raw) throw new Error('Missing item id');
    const id = Number(raw);
    if (Number.isNaN(id)) throw new Error('Invalid item id');
    return id;
  }
}

let _service: ItemsService | null = null;
export function getItemsService(): ItemsService {
  if (!_service) {
    const useDrizzle = Boolean(process.env.DATABASE_URL || process.env.DRIZZLE_DATABASE_URL);
    _service = new ItemsService(useDrizzle ? new DrizzleItemRepository() : new SupabaseItemRepository());
  }
  return _service;
}
