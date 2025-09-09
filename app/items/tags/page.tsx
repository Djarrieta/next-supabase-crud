import TableTemplate, {
  TableTemplateColumn,
} from "@/components/table-template";
import Breadcrumb from "@/components/ui/breadcrumb";
import {
  listItemTags,
  updateItemTag,
  deleteItemTag,
  createItemTag,
} from "./actions";
import EditItemTagDialog from "@/components/edit-item-tag-dialog";
import AddItemTagDialog from "./add-item-tag-dialog";
import { ITEM_TAGS_MAX_PAGE_SIZE } from "./constants";
import {
  parsePagination,
  createPageHrefBuilder,
} from "@/components/pagination-server";
import type { ItemTagRow } from "./schema";

export const revalidate = 0;

export default async function ItemTagsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  let rows: ItemTagRow[] = [];
  let total = 0;
  let page = 1;
  let pageSize = ITEM_TAGS_MAX_PAGE_SIZE;
  ({ page, pageSize } = parsePagination({
    searchParams,
    defaultPageSize: ITEM_TAGS_MAX_PAGE_SIZE,
    maxPageSize: ITEM_TAGS_MAX_PAGE_SIZE,
  }));
  try {
    const result = await listItemTags(page, pageSize);
    rows = result?.rows as ItemTagRow[];
    total = result?.total || 0;
    page = result?.page || page;
    pageSize = result?.pageSize || pageSize;
    // No per-item creation now (global tag catalog)
  } catch (e: any) {
    return (
      <p className="text-sm text-red-600">Failed to load tags: {e.message}</p>
    );
  }

  const columns: TableTemplateColumn<ItemTagRow>[] = [
    {
      id: "id",
      header: <span className="w-24 inline-block">ID</span>,
      widthClass: "w-24",
      cell: (r) => <span className="font-mono text-xs">{r.id}</span>,
    },
    { id: "name", header: "Name", cell: (r) => <span>{r.name}</span> },
    {
      id: "actions",
      header: <></>,
      widthClass: "w-32",
      alignRight: true,
      cell: (r) => (
        <div className="flex justify-end">
          <EditItemTagDialog
            id={r.id as number}
            initialName={r.name}
            action={updateItemTag}
            deleteAction={deleteItemTag}
          />
        </div>
      ),
    },
  ];

  const makePageHref = createPageHrefBuilder("/item-tags", {
    pageSize,
    defaultPageSize: ITEM_TAGS_MAX_PAGE_SIZE,
  });

  return (
    <TableTemplate
      title="Item Tags"
      description="Listing all item tags."
      breadcrumb={
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Items", href: "/items" },
            { label: "Tags" },
          ]}
        />
      }
      rows={rows}
      totalRows={total}
      page={page}
      pageSize={pageSize}
      makePageHref={makePageHref}
      columns={columns}
      emptyMessage="No tags found"
      controlsStart={<AddItemTagDialog action={createItemTag} />}
    />
  );
}

// Removed inline wrapper: passing server actions directly to client dialog component.
