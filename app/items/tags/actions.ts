"use server";
// Server actions for itemTags
import { getItemTagsService } from '@/app/items/tags/service';
import { revalidatePath } from 'next/cache';

export async function listItemTags(page: number, pageSize: number) {
  try { return await getItemTagsService().list(page, pageSize); } catch (e) { console.error('listItemTags failed:', e); throw e; }
}

export async function updateItemTag(formData: FormData) {
  try { await getItemTagsService().updateFromForm(formData); } catch (e) { console.error('updateItemTag failed:', e); throw e; }
  revalidatePath('/item-tags');
}

export async function deleteItemTag(formData: FormData) {
  try { await getItemTagsService().deleteFromForm(formData); } catch (e) { console.error('deleteItemTag failed:', e); throw e; }
  revalidatePath('/item-tags');
}

export async function createItemTag(formData: FormData) {
  try { await getItemTagsService().createFromForm(formData); } catch (e) { console.error('createItemTag failed:', e); throw e; }
  revalidatePath('/item-tags');
}
