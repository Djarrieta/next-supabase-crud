import { deleteItem, getItem, updateItem } from "@/app/items/actions";
import Breadcrumb from "@/components/breadcrumb";
import DetailSkeleton from "@/components/detail-skeleton";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ItemDetailClient from "./item-detail-client";

export const revalidate = 5; // small cache window

interface Props {
  params: { itemId: string };
}

async function ItemDetailContent({ id }: { id: number }) {
  const item = await getItem(id);
  if (!item) return notFound();
  return (
    <ItemDetailClient
      initial={{
        id,
        name: (item as any).name || `Item ${id}`,
        description: (item as any).description || "",
        status: (item as any).status,
        sellPrice: Number((item as any).sellPrice || 0),
        purchasePrice: Number((item as any).purchasePrice || 0),
        rentPrice: Number((item as any).rentPrice || 0),
        unique: Boolean((item as any).unique),
        tagNames: ((item as any).tags || []).map((t: any) => t.name),
        components: (item as any).components || [],
      }}
      availableTags={[]}
      onSubmit={updateItem}
      onArchive={deleteItem}
    />
  );
}

export default function ItemDetailPage({ params }: Props) {
  const id = Number(params.itemId);
  if (!id || Number.isNaN(id)) return notFound();
  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Items", href: "/items" },
          { label: `Item ${id}` },
        ]}
      />
      <Suspense fallback={<DetailSkeleton />}>
        <ItemDetailContent id={id} />
      </Suspense>
    </div>
  );
}
