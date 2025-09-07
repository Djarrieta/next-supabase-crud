import AddItemDialog from "@/components/add-item-dialog";
import EditItemDialog from "@/components/edit-item-dialog";
import { createItem, updateItem, deleteItem, listItems } from "./actions";
import StatusFilter from "@/components/status-filter";
import { Item } from "./domain/schema";
import TableTemplate, {
  TableTemplateColumn,
} from "@/components/table-template";
import { MAX_PAGE_SIZE } from "./constants";

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
  const statusFilter = ["active", "inactive", "all"].includes(statusParam || "")
    ? (statusParam as string)
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
      cell: (row) => row.description ?? "",
    },
    {
      id: "status",
      header: <span className="w-28 inline-block">Status</span>,
      widthClass: "w-28",
      cell: (row) => (
        <span
          className={
            row.status === "active"
              ? "inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
              : "inline-flex rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700"
          }
        >
          {row.status}
        </span>
      ),
    },
    {
      id: "actions",
      header: <span className="w-28 inline-block text-right">Actions</span>,
      alignRight: true,
      widthClass: "w-28",
      cell: (row) => (
        <EditItemDialog
          id={row.id}
          initialDescription={row.description ?? ""}
          initialStatus={row.status}
          action={updateItem}
          deleteAction={deleteItem}
        />
      ),
    },
  ];

  return (
    <TableTemplate
      title="Items"
      description='Listing all records from the Supabase table "items".'
      rows={itemsData}
      totalRows={total}
      page={page}
      pageSize={pageSize}
      makePageHref={(p) => {
        const params = new URLSearchParams();
        if (statusFilter !== "active") params.set("status", statusFilter);
        if (p !== 1) params.set("page", String(p));
        if (pageSize !== MAX_PAGE_SIZE)
          params.set("pageSize", String(pageSize));
        const search = params.toString();
        return `/items${search ? `?${search}` : ""}`;
      }}
      columns={columns}
      emptyMessage="No items found"
      controlsStart={<AddItemDialog action={createItem} />}
      controlsEnd={<StatusFilter current={statusFilter} />}
    />
  );
}
