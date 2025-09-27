import { Suspense } from "react";
import Breadcrumb from "@/components/breadcrumb";
import TableSkeleton from "@/components/table-skeleton";
import AddItemDialog from "./add-item-dialog";
import ItemsFilterInput from "@/app/items/items-filter-input";
import { createItem, listItems } from "./actions";
import { MAX_PAGE_SIZE } from "@/app/constants";
import { parseSearchParamsToFilters } from "./filter-utils";
import { ItemsListFilters } from "./service";
import { Item } from "./schema";
import {
  createPageHrefBuilder,
  parsePagination,
} from "@/components/pagination-server";
import TableTemplate, {
  TableTemplateColumn,
} from "@/components/table-template";
import Badges from "@/components/badges";
import Link from "next/link";
import { ViewIcon } from "@/components/icons";

// Allow a small cache window to avoid full fresh render every navigation
export const revalidate = 5;

export default function ItemsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Items" }]} />
      <Suspense fallback={<TableSkeleton rows={6} cols={3} />}>
        <ItemsTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ItemsTable({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  let page = 1;
  let pageSize = MAX_PAGE_SIZE;
  let total = 0;
  let itemsData: Item[] = [];
  const filters: ItemsListFilters = parseSearchParamsToFilters(
    new URLSearchParams(
      Object.entries(searchParams || {}).flatMap(([k, v]) =>
        Array.isArray(v) ? v.map((iv) => [k, iv]) : [[k, v]]
      ) as any
    )
  );
  ({ page, pageSize } = parsePagination({
    searchParams,
    defaultPageSize: MAX_PAGE_SIZE,
    maxPageSize: MAX_PAGE_SIZE,
  }));
  try {
    const listRes = await listItems(filters, page, pageSize);
    itemsData = listRes.rows as Item[];
    total = listRes.total;
    page = listRes.page;
    pageSize = listRes.pageSize;
  } catch (e: any) {
    return (
      <p className="text-sm text-red-600">Failed to load items: {e.message}</p>
    );
  }
  const availableComponents = itemsData.map((i) => ({
    id: i.id,
    description: i.description,
  }));
  const columns: TableTemplateColumn<Item>[] = [
    {
      id: "id",
      header: <span className="w-24 inline-block">ID</span>,
      widthClass: "w-24",
      cell: (row) => <span className="font-mono text-xs">{row.id}</span>,
    },
    {
      id: "name",
      header: "Name",
      cell: (row) => (
        <div className="flex flex-col">
          <span>{row.name ?? ""}</span>
          <Badges
            unique={row.unique}
            status={row.status as string}
            componentsCount={
              Array.isArray((row as any).components)
                ? (row as any).components.length
                : 0
            }
            tags={Array.isArray((row as any).tags) ? (row as any).tags : []}
            className="pt-1"
          />
        </div>
      ),
    },
    {
      id: "actions",
      header: <></>,
      alignRight: true,
      widthClass: "w-28",
      cell: (row) => (
        <Link
          href={`/items/${row.id}`}
          className="inline-flex items-center justify-center rounded border px-2 py-1 text-xs hover:bg-accent"
          aria-label={`View item ${row.id}`}
          title="View details"
        >
          <ViewIcon className="w-4 h-4" />
        </Link>
      ),
    },
  ];
  const extraParams: Record<string, any> = {};
  if (filters.status) extraParams.status = filters.status;
  if (filters.ids && filters.ids.length)
    extraParams.ids = filters.ids.join(",");
  if (filters.nameQuery) extraParams.q = filters.nameQuery;
  if (filters.tagIds && filters.tagIds.length)
    extraParams.tags = filters.tagIds.join(",");
  if (filters.unique !== undefined)
    extraParams.unique = filters.unique ? "true" : "false";
  const makePageHref = createPageHrefBuilder("/items", {
    pageSize,
    defaultPageSize: MAX_PAGE_SIZE,
    extraParams: Object.keys(extraParams).length ? extraParams : undefined,
  });
  return (
    <TableTemplate
      title="Items"
      description="Catalog of sellable or reference entities. Use dialogs to manage status, pricing, uniqueness and tags."
      rows={itemsData}
      totalRows={total}
      page={page}
      pageSize={pageSize}
      makePageHref={makePageHref}
      columns={columns}
      controlsStart={
        <AddItemDialog
          action={createItem}
          availableTags={[]}
          availableComponents={availableComponents}
        />
      }
      controlsEnd={<ItemsFilterInput />}
      emptyMessage="No items found"
    />
  );
}
