import { Suspense } from "react";
import Breadcrumb from "@/components/breadcrumb";
import TableSkeleton from "@/components/table-skeleton";
import { MAX_PAGE_SIZE } from "@/app/constants";
import {
  createPageHrefBuilder,
  parsePagination,
} from "@/components/pagination-server";
import { parseSearchParamsToFilters } from "./filter-utils";
import { listPersons, createPerson } from "./actions";
import TableTemplate, {
  TableTemplateColumn,
} from "@/components/table-template";
import PersonsFilterInput from "./persons-filter-input";
import AddPersonDialog from "./add-person-dialog";
import Link from "next/link";
import { ViewIcon } from "@/components/icons";
import Badges from "@/components/badges";
import { PersonsListFilters } from "./service";

export const revalidate = 5;

interface PersonRow {
  id: number;
  name: string;
  type: string;
  status: string;
  tags?: { id: number; name: string }[];
}

export default function PersonsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Persons" }]}
      />
      <Suspense fallback={<TableSkeleton rows={6} cols={4} />}>
        <PersonsTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function PersonsTable({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  let page = 1;
  let pageSize = MAX_PAGE_SIZE;
  let total = 0;
  let personsData: PersonRow[] = [];
  const filters: PersonsListFilters = parseSearchParamsToFilters(
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
    const listRes = await listPersons(filters, page, pageSize);
    personsData = listRes.rows as any;
    total = listRes.total;
    page = listRes.page;
    pageSize = listRes.pageSize;
  } catch (e: any) {
    return (
      <p className="text-sm text-red-600">
        Failed to load persons: {e.message}
      </p>
    );
  }
  const columns: TableTemplateColumn<PersonRow>[] = [
    {
      id: "id",
      header: <span className="w-24 inline-block">ID</span>,
      widthClass: "w-24",
      cell: (r) => <span className="font-mono text-xs">{r.id}</span>,
    },
    {
      id: "name",
      header: "Name",
      cell: (r) => (
        <div className="flex flex-col">
          <span>{r.name}</span>
          <Badges status={r.status} tags={r.tags || []} className="pt-1" />
        </div>
      ),
    },
    {
      id: "type",
      header: "Type",
      cell: (r) => <span className="text-xs uppercase">{r.type}</span>,
    },
    {
      id: "actions",
      header: <></>,
      alignRight: true,
      widthClass: "w-28",
      cell: (r) => (
        <Link
          href={`/persons/${r.id}`}
          className="inline-flex items-center justify-center rounded border px-2 py-1 text-xs hover:bg-accent"
          aria-label={`View person ${r.id}`}
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
  if (filters.type) extraParams.type = filters.type;
  const makePageHref = createPageHrefBuilder("/persons", {
    pageSize,
    defaultPageSize: MAX_PAGE_SIZE,
    extraParams: Object.keys(extraParams).length ? extraParams : undefined,
  });
  return (
    <TableTemplate
      title="Persons"
      description="Persons management."
      rows={personsData}
      totalRows={total}
      page={page}
      pageSize={pageSize}
      makePageHref={makePageHref}
      columns={columns}
      emptyMessage="No persons found"
      controlsStart={
        <AddPersonDialog action={createPerson} availableTags={[]} />
      }
      controlsEnd={<PersonsFilterInput />}
    />
  );
}
