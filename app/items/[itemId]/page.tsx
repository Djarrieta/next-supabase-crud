import Breadcrumb from "@/components/breadcrumb";
import InlineItemForm from "./inline-item-form";
import {
  getItem,
  listItems as listItemsAction,
  updateItem,
  deleteItem,
} from "@/app/items/actions";
import { listAllItemTags } from "@/app/items/tags/actions";
import { Tag } from "@/components/ui/tag";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Item } from "@/lib/db/schema";

export const revalidate = 0; // always fresh

interface Props {
  params: { itemId: string };
}

async function fetchData(id: number) {
  const [item, tagCatalog, listForComponents] = await Promise.all([
    getItem(id),
    listAllItemTags(),
    // we only need a lightweight list of items to populate component selector; reuse listItems first page
    listItemsAction("all" as any, 1, 200).catch(() => ({
      rows: [],
      total: 0,
      page: 1,
      pageSize: 0,
    })),
  ]);
  return { item, tagCatalog, listForComponents };
}

export default async function ItemDetailPage({ params }: Props) {
  const id = Number(params.itemId);
  if (!id || Number.isNaN(id)) return notFound();
  let itemData: Item | null = null;
  let allTags: { name: string }[] = [];
  let componentCandidates: { id: number; description: string | null }[] = [];
  try {
    const { item, tagCatalog, listForComponents } = await fetchData(id);
    if (!item) return notFound();
    itemData = item as Item;
    allTags = (tagCatalog || [])
      .map((t: any) => ({ name: t.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    componentCandidates = (listForComponents.rows || []).map((r: any) => ({
      id: r.id,
      description: r.description,
    }));
  } catch (e: any) {
    return (
      <p className="text-sm text-red-600">Failed to load item: {e.message}</p>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Items", href: "/items" },
          { label: `Item ${id}` },
        ]}
      />
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Item {id}</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Edit attributes, adjust tags & components directly below. Changes
            save to the database.
          </p>
        </div>
        <div className="rounded border p-4">
          <h2 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-2">
            Edit Item
          </h2>
          <InlineItemForm
            initial={{
              id,
              description: itemData?.description || "",
              status: (itemData as any).status,
              sellPrice: Number(itemData?.sellPrice || 0),
              unique: Boolean(itemData?.unique),
              tagNames: ((itemData as any).tags || []).map((t: any) => t.name),
              components: (itemData as any).components || [],
            }}
            availableTags={allTags}
            availableComponents={componentCandidates}
            onSubmit={updateItem}
            onArchive={deleteItem}
          />
        </div>
      </div>
    </div>
  );
}
