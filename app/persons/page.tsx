import AddPersonDialog from "./add-person-dialog";
import Breadcrumb from "@/components/ui/breadcrumb";
import EditPersonDialog from "./edit-person-dialog";
import StatusFilter from "@/components/status-filter";
import TableTemplate, {
  TableTemplateColumn,
} from "@/components/table-template";
import { Tag, TagVariant } from "@/components/ui/tag";
import {
  createPerson,
  deletePerson,
  listPersons,
  updatePerson,
} from "./actions";
import { listAllPersonTags } from "./tags/actions";
import { MAX_PAGE_SIZE } from "@/app/constants";
import {
  parsePagination,
  createPageHrefBuilder,
} from "@/components/pagination-server";
import { PersonStatusFilter } from "./schema";

export const revalidate = 0;

interface PersonRowUI {
  id: number;
  name: string | null;
  status: string;
  tags?: { id: number; name: string }[];
  components: number[];
}

export default async function PersonsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  let personsData: PersonRowUI[] = [];
  let allTags: { name: string }[] = [];
  let total = 0;
  let page = 1;
  let pageSize = MAX_PAGE_SIZE;
  const raw = searchParams?.status;
  const statusParam = Array.isArray(raw) ? raw[0] : raw;
  const statusAllowed: PersonStatusFilter[] = ["active", "inactive", "all"];
  const statusFilter: PersonStatusFilter = statusAllowed.includes(
    statusParam as PersonStatusFilter
  )
    ? (statusParam as PersonStatusFilter)
    : "active";
  ({ page, pageSize } = parsePagination({
    searchParams,
    defaultPageSize: MAX_PAGE_SIZE,
    maxPageSize: MAX_PAGE_SIZE,
  }));
  try {
    const [personsResult, tagCatalog] = await Promise.all([
      listPersons(statusFilter, page, pageSize),
      listAllPersonTags(),
    ]);
    personsData = personsResult.rows as PersonRowUI[];
    total = personsResult.total;
    page = personsResult.page;
    pageSize = personsResult.pageSize;
    allTags = tagCatalog
      .map((t: any) => ({ name: t.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (e: any) {
    return (
      <p className="text-sm text-red-600">
        Failed to load persons: {e.message}
      </p>
    );
  }
  const availableComponents = personsData.map((p) => ({
    id: p.id,
    name: p.name,
  }));
  const columns: TableTemplateColumn<PersonRowUI>[] = [
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
          <div className="flex flex-wrap gap-1 pt-1">
            {(() => {
              const variantMap: Record<string, TagVariant> = {
                active: "success",
                inactive: "warning",
                archived: "error",
              };
              const variant = variantMap[row.status] ?? "default";
              return <Tag variant={variant}>{row.status}</Tag>;
            })()}
            {Array.isArray((row as any).components) &&
              (row as any).components.length > 0 && (
                <Tag variant="warning">
                  {(row as any).components.length} comps
                </Tag>
              )}
            {Array.isArray((row as any).tags) &&
              ((row as any).tags as { id: number; name: string }[]).map((t) => (
                <Tag key={t.id} variant="default">
                  {t.name}
                </Tag>
              ))}
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
        <EditPersonDialog
          id={row.id}
          initialValues={{
            name: row.name ?? "",
            status: row.status as any,
            tagNames: ((row as any).tags || []).map((t: any) => t.name),
            components: (row as any).components || [],
          }}
          availableTags={allTags}
          availableComponents={availableComponents}
          action={updatePerson}
          deleteAction={deletePerson}
        />
      ),
    },
  ];

  const makePageHref = createPageHrefBuilder("/persons", {
    pageSize,
    defaultPageSize: MAX_PAGE_SIZE,
    extraParams:
      statusFilter !== "active" ? { status: statusFilter } : undefined,
  });

  return (
    <TableTemplate
      title="Persons"
      description="Directory of people. Each person has a name, lifecycle status (active / inactive / archived), zero or more tags for grouping, and optional component relationships to other persons (e.g., team members, hierarchy). Use the Add / Edit dialogs to manage details, change status, and attach or create tags. Archiving performs a soft delete."
      breadcrumb={
        <Breadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Persons" }]}
        />
      }
      rows={personsData}
      totalRows={total}
      page={page}
      pageSize={pageSize}
      makePageHref={makePageHref}
      columns={columns}
      emptyMessage="No persons found"
      controlsStart={
        <AddPersonDialog
          action={createPerson}
          availableTags={allTags}
          availableComponents={availableComponents}
        />
      }
      controlsEnd={<StatusFilter current={statusFilter} />}
    />
  );
}
