"use server";
// Server actions for itemTags
import { getItemTagsService } from '@/app/item-tags/domain/service';

export async function listItemTags(page: number, pageSize: number) {
  try { return await getItemTagsService().list(page, pageSize); } catch (e) { console.error('listItemTags failed:', e); throw e; }
}
