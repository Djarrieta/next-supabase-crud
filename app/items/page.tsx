import AddItemDialog from "@/components/add-item-dialog";
import EditItemDialog from "@/components/edit-item-dialog";
import StatusFilter from "@/components/status-filter";
import TableTemplate, {
  TableTemplateColumn,
} from "@/components/table-template";
import { createItem, deleteItem, listItems, updateItem } from "./actions";
import { MAX_PAGE_SIZE } from "./constants";
import { Item, ItemStatusFilter } from "./domain/schema";

export const revalidate = 0; // always fresh

export default async function ItemsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  let itemsData: Item[] = [];
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
  const rawPage = searchParams?.page;
  const rawPageSize = searchParams?.pageSize;
  const parsedPage = Number(Array.isArray(rawPage) ? rawPage[0] : rawPage);
  const parsedPageSize = Number(
    Array.isArray(rawPageSize) ? rawPageSize[0] : rawPageSize
  );
  page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  pageSize =
    Number.isFinite(parsedPageSize) &&
    parsedPageSize > 0 &&
    parsedPageSize <= MAX_PAGE_SIZE
      ? parsedPageSize
      : MAX_PAGE_SIZE;
  try {
    const result = await listItems(statusFilter, page, pageSize);
    itemsData = result.rows as Item[];
    total = result.total;
    page = result.page;
    pageSize = result.pageSize;
  } catch (e: any) {
    return (
      <p className="text-sm text-red-600">Failed to load items: {e.message}</p>
    );
  }
  // Columns definition using generic table component
  const columns: TableTemplateColumn<Item>[] = [
    {
      id: "id",
      header: <span className="w-24 inline-block">ID</span>,
      widthClass: "w-24",
      cell: (row) => <span className="font-mono text-xs">{row.id}</span>,
    },
    {
      id: "description",
      header: "Description",
      cell: (row) => (
        <div className="flex flex-col">
          <span>{row.description ?? ""}</span>
          <div>
            {row.status === "active" ? (
              <span className="text-xs font-medium text-green-700">Active</span>
            ) : (
              <span className="text-xs font-medium text-yellow-700">
                Inactive
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "actions",
      header: <></>,
      alignRight: true,
      widthClass: "w-28",
      cell: (row) => (
        <EditItemDialog
          id={row.id}
          initialDescription={row.description ?? ""}
          initialStatus={row.status}
          initialSellPrice={(row as any).sellPrice || 0}
          initialUnique={Boolean((row as any).unique)}
          action={updateItem}
          deleteAction={deleteItem}
        />
      ),
    },
  ];

  const makePageHref = (p: number) => {
    const params = new URLSearchParams();
    if (statusFilter !== "active") params.set("status", statusFilter);
    if (p !== 1) params.set("page", String(p));
    if (pageSize !== MAX_PAGE_SIZE) params.set("pageSize", String(pageSize));
    const search = params.toString();
    return `/items${search ? `?${search}` : ""}`;
  };

  return (
    <TableTemplate
      title="Items"
      description="Listing all items."
      rows={itemsData}
      totalRows={total}
      page={page}
      pageSize={pageSize}
      makePageHref={makePageHref}
      columns={columns}
      emptyMessage="No items found"
      controlsStart={<AddItemDialog action={createItem} />}
      controlsEnd={<StatusFilter current={statusFilter} />}
    />
  );
}
