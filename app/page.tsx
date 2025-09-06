import { getSupabaseClient } from "@/lib/supabaseClient";
import { getDb, items, type Item as DrizzleItem } from "@/lib/db/client";
import { asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Item = { id: number; description: string };

// Server action to create a new item
export async function createItem(formData: FormData) {
  "use server";
  const description = String(formData.get("description") || "").trim();
  // Fallback text if user leaves empty
  const finalDescription = description || "Untitled item";
  // Try Drizzle first
  try {
    if (process.env.DATABASE_URL || process.env.DRIZZLE_DATABASE_URL) {
      await getDb().insert(items).values({ description: finalDescription });
    } else {
      // Supabase fallback (REST insert)
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("items")
        .insert({ description: finalDescription });
      if (error) throw error;
    }
  } catch (e) {
    console.error("createItem failed:", e);
    throw e; // Let Next.js surface the error
  }
  // Revalidate the home page so the new row appears immediately
  revalidatePath("/");
}

async function fetchItems(): Promise<Item[]> {
  // Prefer Drizzle (direct Postgres) if DATABASE_URL is configured; fallback to Supabase REST.
  if (process.env.DATABASE_URL || process.env.DRIZZLE_DATABASE_URL) {
    try {
      const rows: DrizzleItem[] = await getDb()
        .select()
        .from(items)
        .orderBy(asc(items.id));
      return rows.map((r) => ({
        id: r.id as number,
        description: r.description ?? "",
      }));
    } catch (e) {
      console.warn("Drizzle query failed, falling back to Supabase client:", e);
    }
  }
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("items")
    .select("id, description")
    .order("id");
  if (error) throw error;
  return data as Item[];
}

export const revalidate = 0; // always fresh

export default async function Page() {
  let items: Item[] = [];
  try {
    items = await fetchItems();
  } catch (e: any) {
    return (
      <p className="text-sm text-red-600">Failed to load items: {e.message}</p>
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Items</h1>
        <p className="text-sm text-muted-foreground">
          Listing all records from the Supabase table "items".
        </p>
      </div>
      <form
        action={createItem}
        className="flex items-end gap-2 border rounded-md p-3 bg-muted/30"
      >
        <div className="flex-1 space-y-1">
          <label
            htmlFor="description"
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Description
          </label>
          <input
            id="description"
            name="description"
            placeholder="New item description"
            className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            maxLength={500}
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          Add Item
        </button>
      </form>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">ID</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="text-center text-muted-foreground"
                >
                  No items found
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs">{item.id}</TableCell>
                <TableCell>{item.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
