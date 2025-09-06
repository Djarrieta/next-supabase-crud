"use server";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { getDb, items } from "@/lib/db/client";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createItem(formData: FormData) {
  const description = String(formData.get("description") || "").trim();
  const finalDescription = description || "Untitled item";
  try {
    if (process.env.DATABASE_URL || process.env.DRIZZLE_DATABASE_URL) {
  await getDb().insert(items).values({ description: finalDescription });
    } else {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("items")
        .insert({ description: finalDescription });
      if (error) throw error;
    }
  } catch (e) {
    console.error("createItem failed:", e);
    throw e;
  }
  revalidatePath("/");
}

export async function updateItem(formData: FormData) {
  const idRaw = formData.get("id");
  const description = String(formData.get("description") || "").trim();
  const status = String(formData.get("status") || "active").trim();
  if (!idRaw) {
    throw new Error("Missing item id");
  }
  const id = Number(idRaw);
  if (Number.isNaN(id)) {
    throw new Error("Invalid item id");
  }
  const finalDescription = description || "Untitled item";
  try {
    if (process.env.DATABASE_URL || process.env.DRIZZLE_DATABASE_URL) {
      await getDb()
        .update(items)
        .set({ description: finalDescription, status })
        .where(eq(items.id, id));
    } else {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("items")
        .update({ description: finalDescription, status })
        .eq("id", id)
        .single();
      if (error) throw error;
    }
  } catch (e) {
    console.error("updateItem failed:", e);
    throw e;
  }
  revalidatePath("/");
}

export async function deleteItem(formData: FormData) {
  const idRaw = formData.get("id");
  if (!idRaw) throw new Error("Missing item id");
  const id = Number(idRaw);
  if (Number.isNaN(id)) throw new Error("Invalid item id");
  try {
    if (process.env.DATABASE_URL || process.env.DRIZZLE_DATABASE_URL) {
      // Soft delete -> set status to inactive
      await getDb()
        .update(items)
        .set({ status: "inactive" })
        .where(eq(items.id, id));
    } else {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("items")
        .update({ status: "inactive" })
        .eq("id", id)
        .single();
      if (error) throw error;
    }
  } catch (e) {
    console.error("deleteItem failed:", e);
    throw e;
  }
  revalidatePath("/");
}
