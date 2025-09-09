import TableTemplate, {
  TableTemplateColumn,
} from "@/components/table-template";
import { listItemTags } from "./actions";
import { ITEM_TAGS_MAX_PAGE_SIZE } from "./constants";
import {
  parsePagination,
  createPageHrefBuilder,
} from "@/components/pagination-server";
import type { ItemTagRow } from "./domain/schema";

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
    // Actions removed (tags are item-scoped and managed via item forms)
  ];

  const makePageHref = createPageHrefBuilder("/item-tags", {
    pageSize,
    defaultPageSize: ITEM_TAGS_MAX_PAGE_SIZE,
  });

  return (
    <TableTemplate
      title="Item Tags"
      description="Listing all item tags."
      rows={rows}
      totalRows={total}
      page={page}
      pageSize={pageSize}
      makePageHref={makePageHref}
      columns={columns}
      emptyMessage="No tags found"
      controlsStart={null}
    />
  );
}
