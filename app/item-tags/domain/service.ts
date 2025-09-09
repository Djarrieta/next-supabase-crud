// Domain/service layer for itemTags (simple name catalog)
// Keep pure domain + persistence orchestrations only.
// Forbidden imports: react, next/* (except server utilities), UI components.

import { getSupabaseClient } from '@/lib/supabaseClient';
import { getDb, itemTags } from '@/lib/db/client';
import { eq, sql } from 'drizzle-orm';
import type { ItemTagRow } from './schema';

export interface PaginatedResult<T> { rows: T[]; total: number; page: number; pageSize: number }
export interface ItemTagsRepository {
  // Mutations disabled in one-to-many model (tags created via Items forms)
  list(page: number, pageSize: number): Promise<PaginatedResult<ItemTagRow>>;
}

class DrizzleItemTagsRepository implements ItemTagsRepository {
  async list(page: number, pageSize: number): Promise<PaginatedResult<ItemTagRow>> {
    const db = getDb();
    const offset = (page - 1) * pageSize;
    const [{ value: total }] = await db.select({ value: sql<number>`count(*)` }).from(itemTags);
    const rows = await db.select().from(itemTags).orderBy(itemTags.id).limit(pageSize).offset(offset);
    return { rows: rows as ItemTagRow[], total: Number(total) || 0, page, pageSize };
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
}

export class ItemTagsService {
  constructor(private repo: ItemTagsRepository) {}
  // Mutations disabled: tags are managed per item; page is read-only.
  async list(page: number, pageSize: number) {
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safePageSize = Number.isFinite(pageSize) && pageSize > 0 && pageSize <= 100 ? Math.floor(pageSize) : 10;
    return this.repo.list(safePage, safePageSize);
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
