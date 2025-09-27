import { Suspense } from "react";
import Breadcrumb from "@/components/breadcrumb";
import TableSkeleton from "@/components/table-skeleton";
import AddProjectDialog from "./add-project-dialog";
import { createProject, listProjects } from "./actions";
import { MAX_PAGE_SIZE } from "@/app/constants";
import { parseSearchParamsToFilters } from "./filter-utils";
import { ProjectsListFilters } from "./service";
import {
  createPageHrefBuilder,
  parsePagination,
} from "@/components/pagination-server";
import TableTemplate, {
  TableTemplateColumn,
} from "@/components/table-template";
import ProjectsFilterInput from "@/components/projects-filter-input";
import Link from "next/link";
import { ViewIcon } from "@/components/icons";

export const revalidate = 5;

interface ProjectRow {
  id: number;
  name: string;
  description: string | null;
  status: string;
  personId: number;
  person?: { id: number; name: string };
}

export default function ProjectsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Projects" }]}
      />
      <Suspense fallback={<TableSkeleton rows={6} cols={4} />}>
        {" "}
        <ProjectsTable searchParams={searchParams} />{" "}
      </Suspense>
    </div>
  );
}

async function ProjectsTable({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  let page = 1;
  let pageSize = MAX_PAGE_SIZE;
  let total = 0;
  let rows: ProjectRow[] = [];
  const filters: ProjectsListFilters = parseSearchParamsToFilters(
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
    const res = await listProjects(filters, page, pageSize);
    rows = res.rows as any;
    total = res.total;
    page = res.page;
    pageSize = res.pageSize;
  } catch (e: any) {
    return (
      <p className="text-sm text-red-600">
        Failed to load projects: {e.message}
      </p>
    );
  }
  const columns: TableTemplateColumn<ProjectRow>[] = [
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
          <span className="text-[10px] text-muted-foreground">
            {r.person ? `Person: ${r.person.name}` : "—"}
          </span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      widthClass: "w-24",
      cell: (r) => <span className="text-xs uppercase">{r.status}</span>,
    },
    {
      id: "actions",
      header: <></>,
      alignRight: true,
      widthClass: "w-28",
      cell: (r) => (
        <Link
          href={`/projects/${r.id}`}
          className="inline-flex items-center justify-center rounded border px-2 py-1 text-xs hover:bg-accent"
          aria-label={`View project ${r.id}`}
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
  if (filters.personIds && filters.personIds.length)
    extraParams.person = filters.personIds.join(",");
  const makePageHref = createPageHrefBuilder("/projects", {
    pageSize,
    defaultPageSize: MAX_PAGE_SIZE,
    extraParams: Object.keys(extraParams).length ? extraParams : undefined,
  });
  const availablePersons = rows
    .filter((r) => r.person)
    .map((r) => ({ id: r.person!.id, name: r.person!.name }));
  const distinctPersonsMap = new Map<number, string>();
  availablePersons.forEach((p) => distinctPersonsMap.set(p.id, p.name));
  const distinctPersons = Array.from(distinctPersonsMap.entries()).map(
    ([id, name]) => ({ id, name })
  );
  return (
    <TableTemplate
      title="Projects"
      description="Projects referencing persons."
      rows={rows}
      totalRows={total}
      page={page}
      pageSize={pageSize}
      makePageHref={makePageHref}
      columns={columns}
      emptyMessage="No projects found"
      controlsStart={
        <AddProjectDialog
          action={createProject}
          availablePersons={distinctPersons}
        />
      }
      controlsEnd={<ProjectsFilterInput />}
    />
  );
}
