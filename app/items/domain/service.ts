// Domain/service layer for Items.
// Keep pure domain + persistence orchestrations only.
// Forbidden imports: react, next/* (except server-only utilities if truly infra), any UI/components, app/* outside domain folders.
// Allowed: lib/db, lib/supabaseClient, other domain modules, value objects, utilities.

import { getSupabaseClient } from '@/lib/supabaseClient';
import { getDb, Item, items, ItemStatus, ITEM_STATUS_VALUES } from '@/lib/db/client';
import { eq, sql } from 'drizzle-orm';
import { ItemStatusFilter } from '@/app/items/domain/schema';

export interface ItemUpdate { description?: string; status?: ItemStatus; sellPrice?: number; unique?: boolean }

export interface PaginatedResult<T> { rows: T[]; total: number; page: number; pageSize: number }
export interface ItemRepository {
  create(description: string, sellPrice: number, unique: boolean): Promise<void>;
  update(id: number, update: ItemUpdate): Promise<void>;
  list(statusFilter: ItemStatusFilter, page: number, pageSize: number): Promise<PaginatedResult<Item>>;
}

class DrizzleItemRepository implements ItemRepository {
  async create(description: string, sellPrice: number, unique: boolean) {
    await getDb().insert(items).values({ description, sellPrice: sellPrice.toFixed(2), unique });
  }
  async update(id: number, update: ItemUpdate) {
    if (!id || Number.isNaN(id)) throw new Error('Invalid item id');
    const updateData: Record<string, unknown> = {};
    if (update.description !== undefined) updateData.description = update.description;
    if (update.status !== undefined) updateData.status = update.status;
  if (update.sellPrice !== undefined) updateData.sellPrice = update.sellPrice.toFixed(2);
  if (update.unique !== undefined) updateData.unique = update.unique;
  if (Object.keys(updateData).length === 0) return;
    await getDb().update(items).set(updateData).where(eq(items.id, id));
  }
  async list(statusFilter: ItemStatusFilter, page: number, pageSize: number): Promise<PaginatedResult<Item>> {
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
    const mapped = pageRows.map(r => ({
      id: r.id as number,
      description: r.description ?? null,
      status: ((r as any).status || 'active') as ItemStatus,
      sellPrice: (r as any).sellPrice ? String((r as any).sellPrice) : '0',
      unique: Boolean((r as any).unique)
    })) as unknown as Item[];
    return { rows: mapped, total: Number(total) || 0, page, pageSize };
  }
}

class SupabaseItemRepository implements ItemRepository {
  async create(description: string, sellPrice: number, unique: boolean) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('items').insert({ description, sell_price: sellPrice, unique });
    if (error) throw error;
  }
  async update(id: number, update: ItemUpdate) {
    if (!id || Number.isNaN(id)) throw new Error('Invalid item id');
    const updateData: Record<string, unknown> = {};
    if (update.description !== undefined) updateData.description = update.description;
    if (update.status !== undefined) updateData.status = update.status;
  if (update.sellPrice !== undefined) updateData.sell_price = update.sellPrice;
  if (update.unique !== undefined) updateData.unique = update.unique;
  if (Object.keys(updateData).length === 0) return;
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('items')
      .update(updateData)
      .eq('id', id)
      .single();
    if (error) throw error;
  }
  async list(statusFilter: ItemStatusFilter, page: number, pageSize: number): Promise<PaginatedResult<Item>> {
    const supabase = getSupabaseClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase
      .from('items')
      .select('id, description, status, sell_price, unique', { count: 'exact' })
      .order('id')
      .range(from, to);
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    const { data, error, count } = await query;
    if (error) throw error;
    const mapped = (data || []).map(r => ({
      id: (r as any).id as number,
      description: (r as any).description ?? null,
      status: ((r as any).status || 'active') as ItemStatus,
      sellPrice: (r as any).sell_price != null ? String((r as any).sell_price) : '0',
      unique: Boolean((r as any).unique)
    })) as unknown as Item[];
    return { rows: mapped, total: count || 0, page, pageSize };
  }
}

export class ItemsService {
  constructor(private repo: ItemRepository) {}
  async createFromForm(formData: FormData) {
    const description = String(formData.get('description') || '').trim();
    const sellPriceRaw = String(formData.get('sellPrice') || '0').trim();
    const uniqueRaw = formData.get('unique');
    const sellPrice = Number(parseFloat(sellPriceRaw));
    const unique = uniqueRaw === 'on' || uniqueRaw === 'true' || uniqueRaw === '1';
    const finalDescription = description || 'Untitled item';
    await this.repo.create(finalDescription, Number.isFinite(sellPrice) ? sellPrice : 0, unique);
  }
  async updateFromForm(formData: FormData) {
    const id = this.extractId(formData);
  const description = String(formData.get('description') || '').trim();
  const sellPriceRaw = String(formData.get('sellPrice') || '').trim();
  const uniqueRaw = formData.get('unique');
  const sellPrice = sellPriceRaw ? Number(parseFloat(sellPriceRaw)) : undefined;
  const unique = uniqueRaw != null ? (uniqueRaw === 'on' || uniqueRaw === 'true' || uniqueRaw === '1') : undefined;
    const rawStatus = String(formData.get('status') || 'active').trim();
    const status: ItemStatus = (ITEM_STATUS_VALUES as readonly string[]).includes(rawStatus)
      ? (rawStatus as ItemStatus)
      : 'active';
    const finalDescription = description || 'Untitled item';
  await this.repo.update(id, { description: finalDescription, status, sellPrice, unique });
  }
  async softDeleteFromForm(formData: FormData) {
    const id = this.extractId(formData);
    await this.repo.update(id, { status: 'archived' });
  }
  async list(statusFilter: ItemStatusFilter, page: number, pageSize: number) {
    const allowed: ItemStatusFilter[] = ['active', 'inactive', 'archived', 'all'];
    const filter: ItemStatusFilter = allowed.includes(statusFilter) ? statusFilter : 'active';
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
