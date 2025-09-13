// Server actions for Items.
// Only import the domain service (app/items/domain/service) and framework utilities (next/*).
// Do NOT import UI components or client-only modules here.

"use server";
import { revalidatePath } from "next/cache";
import { getItemsService, ItemsListFilters } from "@/app/items/service";

export async function createItem(formData: FormData) {
  try {
    await getItemsService().createFromForm(formData);
  } catch (e) {
    console.error("createItem failed:", e);
    throw e;
  }
  revalidatePath("/items");
}

export async function updateItem(formData: FormData) {
  try {
    await getItemsService().updateFromForm(formData);
  } catch (e) {
    console.error("updateItem failed:", e);
    throw e;
  }
  revalidatePath("/items");
  const id = formData.get('id');
  if (id) revalidatePath(`/items/${id}`);
}

export async function deleteItem(formData: FormData) {
  try {
    await getItemsService().softDeleteFromForm(formData);
  } catch (e) {
    console.error("deleteItem failed:", e);
    throw e;
  }
  revalidatePath("/items");
  const id = formData.get('id');
  if (id) revalidatePath(`/items/${id}`);
}

export async function listItems(filters: ItemsListFilters, page: number, pageSize: number) {
  try {
    return await getItemsService().list(filters, page, pageSize);
  } catch (e) {
    console.error("listItems failed:", e);
    throw e;
  }
}

export async function getItem(id: number) {
  try {
    return await getItemsService().get(id);
  } catch (e) {
    console.error('getItem failed:', e);
    throw e;
  }
}

// Lightweight search for item component picking (id or name fragment)
// Returns up to `limit` items excluding provided ids.
export async function searchItemsForComponents(query: string, excludeIds: number[] = [], limit = 20) {
  try {
    const service = getItemsService();
    const trimmed = (query || '').trim();
    const numericId = Number(trimmed);
    const results: { id: number; name: string; description: string | null }[] = [];
    const excludeSet = new Set(excludeIds.filter(v => Number.isInteger(v)));
    // If numeric and valid id, attempt direct fetch first for precision add.
    if (trimmed && Number.isInteger(numericId) && numericId > 0) {
      const byId = await service.get(numericId);
      if (byId && !excludeSet.has(byId.id)) {
        results.push({ id: byId.id, name: byId.name, description: (byId as any).description || null });
      }
    }
    // Name / substring search (always if have query length >= 1)
    if (!trimmed || trimmed.length >= 1) {
      const list = await service.list({ status: 'all', nameQuery: trimmed || undefined }, 1, limit);
      for (const r of list.rows) {
        if (excludeSet.has(r.id)) continue;
        if (!results.find(x => x.id === r.id)) {
          results.push({ id: r.id, name: r.name, description: (r as any).description || null });
        }
        if (results.length >= limit) break;
      }
    }
    return results.slice(0, limit);
  } catch (e) {
    console.error('searchItemsForComponents failed:', e);
    return [] as { id: number; name: string; description: string | null }[];
  }
}
