import {
  deleteItem,
  getItem,
  listItems as listItemsAction,
  updateItem,
} from "@/app/items/actions";
import { listAllItemTags } from "@/app/items/tags/actions";
import Breadcrumb from "@/components/breadcrumb";
import { Item } from "@/lib/db/schema";
import { notFound } from "next/navigation";
import ItemDetailClient from "./item-detail-client";

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
      <ItemDetailClient
        initial={{
          id,
          name: (itemData as any).name || `Item ${id}`,
          description: itemData?.description || "",
          status: (itemData as any).status,
          sellPrice: Number(itemData?.sellPrice || 0),
          purchasePrice: Number((itemData as any).purchasePrice || 0),
          rentPrice: Number((itemData as any).rentPrice || 0),
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
  );
}
