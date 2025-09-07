import { getSupabaseClient } from "@/lib/supabaseClient";
import { getDb, items } from "@/lib/db/client";
import { eq } from "drizzle-orm";

export interface ItemUpdate { description?: string; status?: string }
export interface ItemRepository {
  create(description: string): Promise<void>;
  update(id: number, update: ItemUpdate): Promise<void>;
}

class DrizzleItemRepository implements ItemRepository {
  async create(description: string) {
    await getDb().insert(items).values({ description });
  }
  async update(id: number, update: ItemUpdate) {
    if (!id || Number.isNaN(id)) throw new Error("Invalid item id");
    const updateData: Record<string, unknown> = {};
    if (update.description !== undefined) updateData.description = update.description;
    if (update.status !== undefined) updateData.status = update.status;
    if (Object.keys(updateData).length === 0) return;
    await getDb().update(items).set(updateData).where(eq(items.id, id));
  }
}

class SupabaseItemRepository implements ItemRepository {
  async create(description: string) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("items").insert({ description });
    if (error) throw error;
  }
  async update(id: number, update: ItemUpdate) {
    if (!id || Number.isNaN(id)) throw new Error("Invalid item id");
    const updateData: Record<string, unknown> = {};
    if (update.description !== undefined) updateData.description = update.description;
    if (update.status !== undefined) updateData.status = update.status;
    if (Object.keys(updateData).length === 0) return;
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("items")
      .update(updateData)
      .eq("id", id)
      .single();
    if (error) throw error;
  }
}

export class ItemsService {
  constructor(private repo: ItemRepository) {}
  async createFromForm(formData: FormData) {
    const description = String(formData.get("description") || "").trim();
    const finalDescription = description || "Untitled item";
    await this.repo.create(finalDescription);
  }
  async updateFromForm(formData: FormData) {
    const id = this.extractId(formData);
    const description = String(formData.get("description") || "").trim();
    const status = String(formData.get("status") || "active").trim();
    const finalDescription = description || "Untitled item";
    await this.repo.update(id, { description: finalDescription, status });
  }
  async softDeleteFromForm(formData: FormData) {
    const id = this.extractId(formData);
    await this.repo.update(id, { status: "archived" });
  }
  private extractId(formData: FormData): number {
    const raw = formData.get("id");
    if (!raw) throw new Error("Missing item id");
    const id = Number(raw);
    if (Number.isNaN(id)) throw new Error("Invalid item id");
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
