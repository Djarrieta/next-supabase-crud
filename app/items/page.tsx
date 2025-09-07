import { getSupabaseClient } from "@/lib/supabaseClient";
import { getDb, items, type Item as DrizzleItem } from "@/lib/db/client";
import { asc, eq } from "drizzle-orm";
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
import { createItem, updateItem, deleteItem } from "./actions";
import StatusFilter from "@/components/status-filter";

type Item = { id: number; description: string; status?: string };

async function fetchItems(statusFilter: string): Promise<Item[]> {
  // Prefer Drizzle (direct Postgres) if DATABASE_URL is configured; fallback to Supabase REST.
  if (process.env.DATABASE_URL || process.env.DRIZZLE_DATABASE_URL) {
    try {
      const db = getDb();
      let rows: DrizzleItem[];
      if (statusFilter === "all") {
        rows = await db.select().from(items).orderBy(asc(items.id));
      } else {
        rows = await db
          .select()
          .from(items)
          .where(eq(items.status, statusFilter as any))
          .orderBy(asc(items.id));
      }
      return rows.map((r) => ({
        id: r.id as number,
        description: r.description ?? "",
        status: (r as any).status ?? "active",
      }));
    } catch (e) {
      console.warn("Drizzle query failed, falling back to Supabase client:", e);
    }
  }
  const supabase = getSupabaseClient();
  let query = supabase
    .from("items")
    .select("id, description, status")
    .order("id");
  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as Item[];
}

export const revalidate = 0; // always fresh

export default async function ItemsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  let itemsData: Item[] = [];
  // Derive status filter from search params. Default to 'active'. Acceptable values: active | inactive | all
  const raw = searchParams?.status;
  const statusParam = Array.isArray(raw) ? raw[0] : raw;
  const statusFilter = ["active", "inactive", "all"].includes(statusParam || "")
    ? (statusParam as string)
    : "active";
  try {
    itemsData = await fetchItems(statusFilter);
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
      <div className="flex flex-wrap items-center gap-4">
        <AddItemDialog action={createItem} />
        <StatusFilter current={statusFilter} />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">ID</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itemsData.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  No items found
                </TableCell>
              </TableRow>
            )}
            {itemsData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs">{item.id}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>
                  <span
                    className={
                      item.status === "active"
                        ? "inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                        : "inline-flex rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700"
                    }
                  >
                    {item.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <EditItemDialog
                    id={item.id}
                    initialDescription={item.description}
                    initialStatus={item.status}
                    action={updateItem}
                    deleteAction={deleteItem}
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
