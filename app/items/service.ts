// Clean implementation (one-to-many: item has many itemTags rows)
import { getSupabaseClient } from '@/lib/supabaseClient';
import { getDb, Item, items, ItemStatus, ITEM_STATUS_VALUES, itemTags } from '@/lib/db/client';
import { eq, sql, inArray } from 'drizzle-orm';
import { ItemStatusFilter } from '@/app/items/schema';

export interface ItemUpdate { description?: string; status?: ItemStatus; sellPrice?: number; unique?: boolean; tagNames?: string[] }
export interface PaginatedResult<T> { rows: T[]; total: number; page: number; pageSize: number }
export interface ItemRepository {
  create(description: string, sellPrice: number, unique: boolean, tagNames: string[]): Promise<void>;
  update(id: number, update: ItemUpdate): Promise<void>;
  list(statusFilter: ItemStatusFilter, page: number, pageSize: number): Promise<PaginatedResult<Item>>;
}

class DrizzleItemRepository implements ItemRepository {
  async create(description: string, sellPrice: number, unique: boolean, tagNames: string[]) {
    const db = getDb();
    await db.transaction(async (tx) => {
      // Resolve tag names -> ids (create missing)
      const distinct = Array.from(new Set(tagNames.map(n => n.trim()).filter(Boolean)));
      let tagIds: number[] = [];
      if (distinct.length) {
        // Fetch existing
        const existing = await tx.select().from(itemTags).where(inArray(itemTags.name, distinct));
        const existingMap = new Map<string, number>(existing.map(r => [r.name || '', r.id as number]));
        const toCreate = distinct.filter(n => !existingMap.has(n));
        if (toCreate.length) {
          const inserted = await tx.insert(itemTags).values(toCreate.map(n => ({ name: n }))).returning({ id: itemTags.id, name: itemTags.name });
          inserted.forEach(r => existingMap.set(r.name || '', r.id as number));
        }
        tagIds = distinct.map(n => existingMap.get(n)!).filter(Boolean);
      }
      await tx.insert(items).values({ description, sellPrice: sellPrice.toFixed(2), unique, tags: tagIds as any }).returning({ id: items.id });
    });
  }
  async update(id: number, update: ItemUpdate) {
    if (!id || Number.isNaN(id)) throw new Error('Invalid item id');
    const db = getDb();
    await db.transaction(async (tx) => {
      const updateData: Record<string, unknown> = {};
      if (update.description !== undefined) updateData.description = update.description;
      if (update.status !== undefined) updateData.status = update.status;
      if (update.sellPrice !== undefined) updateData.sellPrice = update.sellPrice.toFixed(2);
      if (update.unique !== undefined) updateData.unique = update.unique;
      if (update.tagNames) {
        const distinct = Array.from(new Set(update.tagNames.map(n => n.trim()).filter(Boolean)));
        if (distinct.length) {
          const existing = await tx.select().from(itemTags).where(inArray(itemTags.name, distinct));
          const existingMap = new Map<string, number>(existing.map(r => [r.name || '', r.id as number]));
            const toCreate = distinct.filter(n => !existingMap.has(n));
            if (toCreate.length) {
              const inserted = await tx.insert(itemTags).values(toCreate.map(n => ({ name: n }))).returning({ id: itemTags.id, name: itemTags.name });
              inserted.forEach(r => existingMap.set(r.name || '', r.id as number));
            }
          updateData.tags = distinct.map(n => existingMap.get(n)!).filter(Boolean) as any;
        } else {
          updateData.tags = [] as any;
        }
      }
      if (Object.keys(updateData).length) await tx.update(items).set(updateData).where(eq(items.id, id));
    });
  }
  async list(statusFilter: ItemStatusFilter, page: number, pageSize: number): Promise<PaginatedResult<Item>> {
    const db = getDb();
    const offset = (page - 1) * pageSize;
    const countQuery = statusFilter === 'all'
      ? db.select({ value: sql<number>`count(*)` }).from(items)
      : db.select({ value: sql<number>`count(*)` }).from(items).where(eq(items.status, statusFilter));
    const [{ value: total }] = await countQuery;
    const baseRows = await (statusFilter === 'all'
      ? db.select().from(items).orderBy(items.id).limit(pageSize).offset(offset)
      : db.select().from(items).where(eq(items.status, statusFilter)).orderBy(items.id).limit(pageSize).offset(offset));
    // Collect all tag ids referenced
    const allTagIds = Array.from(new Set(baseRows.flatMap(r => (r as any).tags as number[] || [])));
    const tagMapById = new Map<number, { id: number; name: string }>();
    if (allTagIds.length) {
      const tagRows = await db.select().from(itemTags).where(inArray(itemTags.id, allTagIds));
      tagRows.forEach(tr => { tagMapById.set(tr.id as number, { id: tr.id as number, name: tr.name || '' }); });
    }
    const mapped = baseRows.map(r => ({
      id: r.id as number,
      description: r.description ?? null,
      status: ((r as any).status || 'active') as ItemStatus,
      sellPrice: (r as any).sellPrice ? String((r as any).sellPrice) : '0',
      unique: Boolean((r as any).unique),
      tags: ((r as any).tags || []).map((tid: number) => tagMapById.get(tid)).filter(Boolean)
    })) as unknown as Item[];
    return { rows: mapped, total: Number(total) || 0, page, pageSize };
  }
}

class SupabaseItemRepository implements ItemRepository {
  async create(description: string, sellPrice: number, unique: boolean, tagNames: string[]) {
    const supabase = getSupabaseClient();
    // Ensure tags exist, get ids
    const distinct = Array.from(new Set(tagNames.map(n => n.trim()).filter(Boolean)));
    let tagIds: number[] = [];
    if (distinct.length) {
      // fetch existing
      const { data: existing, error: existingErr } = await supabase.from('item_tags').select('id, name').in('name', distinct);
      if (existingErr) throw existingErr;
      const map = new Map<string, number>((existing || []).map(r => [(r as any).name, (r as any).id]));
      const toCreate = distinct.filter(n => !map.has(n));
      if (toCreate.length) {
        const { data: inserted, error: insErr } = await supabase.from('item_tags').insert(toCreate.map(n => ({ name: n }))).select('id, name');
        if (insErr) throw insErr;
        (inserted || []).forEach(r => map.set((r as any).name, (r as any).id));
      }
      tagIds = distinct.map(n => map.get(n)!).filter(Boolean);
    }
    const { error } = await supabase.from('items').insert({ description, sell_price: sellPrice, unique, tags: tagIds }).single();
    if (error) throw error;
  }
  async update(id: number, update: ItemUpdate) {
    if (!id || Number.isNaN(id)) throw new Error('Invalid item id');
    const supabase = getSupabaseClient();
    const updateData: Record<string, unknown> = {};
    if (update.description !== undefined) updateData.description = update.description;
    if (update.status !== undefined) updateData.status = update.status;
    if (update.sellPrice !== undefined) updateData.sell_price = update.sellPrice;
    if (update.unique !== undefined) updateData.unique = update.unique;
    if (update.tagNames) {
      const distinct = Array.from(new Set(update.tagNames.map(n => n.trim()).filter(Boolean)));
      let tagIds: number[] = [];
      if (distinct.length) {
        const { data: existing, error: existErr } = await supabase.from('item_tags').select('id, name').in('name', distinct);
        if (existErr) throw existErr;
        const map = new Map<string, number>((existing || []).map(r => [(r as any).name, (r as any).id]));
        const toCreate = distinct.filter(n => !map.has(n));
        if (toCreate.length) {
          const { data: inserted, error: insErr } = await supabase.from('item_tags').insert(toCreate.map(n => ({ name: n }))).select('id, name');
          if (insErr) throw insErr;
          (inserted || []).forEach(r => map.set((r as any).name, (r as any).id));
        }
        tagIds = distinct.map(n => map.get(n)!).filter(Boolean);
      }
      updateData.tags = tagIds;
    }
    if (Object.keys(updateData).length) {
      const { error } = await supabase.from('items').update(updateData).eq('id', id).single();
      if (error) throw error;
    }
  }
  async list(statusFilter: ItemStatusFilter, page: number, pageSize: number): Promise<PaginatedResult<Item>> {
    const supabase = getSupabaseClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase
      .from('items')
      .select('id, description, status, sell_price, unique, tags', { count: 'exact' })
      .order('id')
      .range(from, to);
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    const { data, error, count } = await query;
    if (error) throw error;
    const itemsData = (data || []);
    const allTagIds = Array.from(new Set(itemsData.flatMap(r => ((r as any).tags as number[]) || [])));
    const tagMapById = new Map<number, { id: number; name: string }>();
    if (allTagIds.length) {
      const { data: tagRows, error: tagErr } = await supabase.from('item_tags').select('id, name').in('id', allTagIds);
      if (tagErr) throw tagErr;
      (tagRows || []).forEach(tr => tagMapById.set((tr as any).id, { id: (tr as any).id, name: (tr as any).name }));
    }
    const mapped = itemsData.map(r => ({
      id: (r as any).id as number,
      description: (r as any).description ?? null,
      status: ((r as any).status || 'active') as ItemStatus,
      sellPrice: (r as any).sell_price != null ? String((r as any).sell_price) : '0',
      unique: Boolean((r as any).unique),
      tags: ((r as any).tags || []).map((tid: number) => tagMapById.get(tid)).filter(Boolean)
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
    const tagNamesRaw = formData.getAll('tags').map(v => String(v)).filter(v => v.trim());
    const tagNames = Array.from(new Set(tagNamesRaw.map(v => v.trim())));
    const finalDescription = description || 'Untitled item';
    await this.repo.create(finalDescription, Number.isFinite(sellPrice) ? sellPrice : 0, unique, tagNames);
  }
  async updateFromForm(formData: FormData) {
    const id = this.extractId(formData);
    const description = String(formData.get('description') || '').trim();
    const sellPriceRaw = String(formData.get('sellPrice') || '').trim();
    const uniqueRaw = formData.get('unique');
    const sellPrice = sellPriceRaw ? Number(parseFloat(sellPriceRaw)) : undefined;
    const unique = uniqueRaw != null ? (uniqueRaw === 'on' || uniqueRaw === 'true' || uniqueRaw === '1') : undefined;
    const rawStatus = String(formData.get('status') || 'active').trim();
    const status: ItemStatus = (ITEM_STATUS_VALUES as readonly string[]).includes(rawStatus) ? (rawStatus as ItemStatus) : 'active';
    let tagNames: string[] | undefined = undefined;
    if (formData.get('_tags_present')) {
      const tagNamesRaw2 = formData.getAll('tags').map(v => String(v)).filter(v => v.trim());
      tagNames = Array.from(new Set(tagNamesRaw2.map(v => v.trim())));
    }
    const finalDescription = description || 'Untitled item';
    await this.repo.update(id, { description: finalDescription, status, sellPrice, unique, tagNames });
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
