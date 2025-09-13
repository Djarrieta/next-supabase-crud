import Breadcrumb from "@/components/breadcrumb";
import TableTemplate, {
  TableTemplateColumn,
} from "@/components/table-template";
import { Tag } from "@/components/ui/tag";
import {
  createPersonTag,
  deletePersonTag,
  listPersonTags,
  updatePersonTag,
} from "./actions";
import { MAX_PAGE_SIZE } from "@/app/constants";
import {
  parsePagination,
  createPageHrefBuilder,
} from "@/components/pagination-server";
import AddPersonTagDialog from "./add-person-tag-dialog";

export const revalidate = 0;

interface PersonTagRow {
  id: number;
  name: string;
}

export default async function PersonTagsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  let tags: PersonTagRow[] = [];
  let total = 0;
  let page = 1;
  let pageSize = MAX_PAGE_SIZE;
  ({ page, pageSize } = parsePagination({
    searchParams,
    defaultPageSize: MAX_PAGE_SIZE,
    maxPageSize: MAX_PAGE_SIZE,
  }));
  try {
    const result = await listPersonTags(page, pageSize);
    tags = result.rows as PersonTagRow[];
    total = result.total;
    page = result.page;
    pageSize = result.pageSize;
  } catch (e: any) {
    return (
      <p className="text-sm text-red-600">Failed to load tags: {e.message}</p>
    );
  }
  const columns: TableTemplateColumn<PersonTagRow>[] = [
    {
      id: "id",
      header: <span className="w-24 inline-block">ID</span>,
      widthClass: "w-24",
      cell: (row) => <span className="font-mono text-xs">{row.id}</span>,
    },
    { id: "name", header: "Name", cell: (row) => <span>{row.name}</span> },
    {
      id: "actions",
      header: <></>,
      alignRight: true,
      widthClass: "w-40",
      cell: (row) => (
        <form
          className="flex justify-end gap-2"
          action={async (fd) => {
            fd.append("id", String(row.id));
            await updatePersonTag(fd);
          }}
        >
          <input type="hidden" name="id" value={row.id} />
          <input
            type="text"
            name="name"
            defaultValue={row.name}
            className="border rounded px-2 py-1 text-xs bg-transparent"
            maxLength={120}
          />
          <button type="submit" className="text-xs underline">
            Save
          </button>
          <button
            formAction={async (fd) => {
              fd.append("id", String(row.id));
              await deletePersonTag(fd);
            }}
            className="text-xs text-destructive underline"
            type="submit"
          >
            Delete
          </button>
        </form>
      ),
    },
  ];
  const makePageHref = createPageHrefBuilder("/persons/tags", {
    pageSize,
    defaultPageSize: MAX_PAGE_SIZE,
  });
  return (
    <TableTemplate
      title="Person Tags"
      description="Global catalog of tags for persons. Use tags to group or filter people. Renaming a tag updates it for all persons. Deleting a tag removes it from all persons' tag arrays."
      breadcrumb={
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Persons", href: "/persons" },
            { label: "Tags" },
          ]}
        />
      }
      rows={tags}
      totalRows={total}
      page={page}
      pageSize={pageSize}
      makePageHref={makePageHref}
      columns={columns}
      emptyMessage="No tags found"
      controlsStart={<AddPersonTagDialog action={createPersonTag} />}
    />
  );
}
