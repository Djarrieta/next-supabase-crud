"use server";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { getDb, items } from "@/lib/db/client";
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
