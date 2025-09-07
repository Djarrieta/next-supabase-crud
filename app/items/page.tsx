import AddItemDialog from "@/components/add-item-dialog";
import EditItemDialog from "@/components/edit-item-dialog";
import { createItem, updateItem, deleteItem, listItems } from "./actions";
import StatusFilter from "@/components/status-filter";
import { Item } from "./domain/schema";
import TableTemplate, {
  TableTemplateColumn,
} from "@/components/table-template";

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
    itemsData = await listItems(statusFilter);
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
      columns={columns}
      emptyMessage="No items found"
      controlsStart={<AddItemDialog action={createItem} />}
      controlsEnd={<StatusFilter current={statusFilter} />}
    />
  );
}
