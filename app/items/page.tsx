import { MAX_PAGE_SIZE } from "@/app/constants";
import Badges from "@/components/badges";
import Breadcrumb from "@/components/breadcrumb";
import { ViewIcon } from "@/components/icons";
import {
  createPageHrefBuilder,
  parsePagination,
} from "@/components/pagination-server";
import StatusFilter from "@/components/status-filter";
import TableTemplate, {
  TableTemplateColumn,
} from "@/components/table-template";
import Link from "next/link";
import { createItem, listItems } from "./actions";
import AddItemDialog from "./add-item-dialog";
import { Item, ItemStatusFilter } from "./schema";
import { listAllItemTags } from "./tags/actions";

export const revalidate = 0; // always fresh

export default async function ItemsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  let itemsData: Item[] = [];
  // Full catalog of tags for dialogs (Add/Edit)
  let allTags: { name: string }[] = [];
  let total = 0;
  let page = 1;
  let pageSize = MAX_PAGE_SIZE;
  // Derive status filter from search params. Default to 'active'. Acceptable values: active | inactive | all
  const raw = searchParams?.status;
  const statusParam = Array.isArray(raw) ? raw[0] : raw;
  const statusAllowed: ItemStatusFilter[] = ["active", "inactive", "all"];
  const statusFilter: ItemStatusFilter = statusAllowed.includes(
    statusParam as ItemStatusFilter
  )
    ? (statusParam as ItemStatusFilter)
    : "active";
  // pagination params
  ({ page, pageSize } = parsePagination({
    searchParams,
    defaultPageSize: MAX_PAGE_SIZE,
    maxPageSize: MAX_PAGE_SIZE,
  }));
  try {
    const [itemsResult, tagCatalog] = await Promise.all([
      listItems(statusFilter, page, pageSize),
      // fetch entire tag catalog (no pagination)
      listAllItemTags(),
    ]);
    itemsData = itemsResult.rows as Item[];
    total = itemsResult.total;
    page = itemsResult.page;
    pageSize = itemsResult.pageSize;
    allTags = tagCatalog
      .map((t: any) => ({ name: t.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (e: any) {
    return (
      <p className="text-sm text-red-600">Failed to load items: {e.message}</p>
    );
  }
  const availableComponents = itemsData.map((i) => ({
    id: i.id,
    description: i.description,
  }));
  // Columns definition using generic table component
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

  const makePageHref = createPageHrefBuilder("/items", {
    pageSize,
    defaultPageSize: MAX_PAGE_SIZE,
    extraParams:
      statusFilter !== "active" ? { status: statusFilter } : undefined,
  });

  return (
    <TableTemplate
      title="Items"
      description="Catalog of sellable or reference entities. Each item has: optional description, lifecycle status (active = available, inactive = temporarily hidden, archived = soft‑deleted), monetary sell price, uniqueness flag, and zero or more tags for fast grouping/filtering. Use the Add / Edit dialogs to manage details, change status, adjust price, toggle uniqueness, and attach or create tags."
      breadcrumb={
        <Breadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Items" }]}
        />
      }
      rows={itemsData}
      totalRows={total}
      page={page}
      pageSize={pageSize}
      makePageHref={makePageHref}
      columns={columns}
      emptyMessage="No items found"
      controlsStart={
        <AddItemDialog
          action={createItem}
          availableTags={allTags}
          availableComponents={availableComponents}
        />
      }
      controlsEnd={<StatusFilter current={statusFilter} />}
    />
  );
}
