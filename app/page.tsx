import { getSupabaseClient } from "@/lib/supabaseClient";
import { getDb, items, type Item as DrizzleItem } from "@/lib/db/client";
import { asc } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AddItemDialog from "@/components/add-item-dialog";
import EditItemDialog from "@/components/edit-item-dialog";
import { createItem, updateItem } from "./actions";

type Item = { id: number; description: string };

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
      <AddItemDialog action={createItem} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">ID</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
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
                <TableCell className="text-right">
                  <EditItemDialog
                    id={item.id}
                    initialDescription={item.description}
                    action={updateItem}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
