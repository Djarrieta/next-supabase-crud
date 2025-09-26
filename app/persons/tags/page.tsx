import Breadcrumb from '@/components/breadcrumb';
import TableTemplate, { TableTemplateColumn } from '@/components/table-template';
import { listPersonTags, createPersonTag, updatePersonTag, deletePersonTag } from './actions';
import AddPersonTagDialog from './add-person-tag-dialog';

export const revalidate = 0;

interface Row { id: number; name: string }

export default async function PersonTagsPage() {
  let rows: Row[] = []; let total=0; let page=1; let pageSize=100;
  try {
    const res = await listPersonTags(page,pageSize);
    rows = res.rows as any; total = res.total; page = res.page; pageSize = res.pageSize;
  } catch (e:any) { return <p className="text-sm text-red-600">Failed to load person tags: {e.message}</p>; }
  const columns: TableTemplateColumn<Row>[] = [
    { id: 'id', header: <span className="w-24 inline-block">ID</span>, widthClass: 'w-24', cell: r => <span className="font-mono text-xs">{r.id}</span> },
    { id: 'name', header: 'Name', cell: r => <form action={updatePersonTag} className="flex items-center gap-2"><input type="hidden" name="id" value={r.id} /><input name="name" defaultValue={r.name} className="border rounded px-2 py-1 text-xs w-48" /><button className="text-xs underline">Save</button></form> },
    { id: 'actions', header: <></>, alignRight: true, widthClass: 'w-28', cell: r => <form action={deletePersonTag}><input type="hidden" name="id" value={r.id} /><button className="text-xs text-red-600 underline" aria-label={`Delete tag ${r.id}`}>Delete</button></form> },
  ];
  return <TableTemplate title="Person Tags" description="Manage tag labels attachable to persons." breadcrumb={<Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Persons', href: '/persons' }, { label: 'Tags' }]} />} rows={rows} totalRows={total} page={page} pageSize={pageSize} makePageHref={(p)=>`/persons/tags?page=${p}`} columns={columns} emptyMessage="No tags" controlsStart={<AddPersonTagDialog action={createPersonTag} />} />;
}
