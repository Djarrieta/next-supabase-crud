import { notFound } from 'next/navigation';
import Breadcrumb from '@/components/breadcrumb';
import { getPerson, updatePerson, deletePerson } from '@/app/persons/actions';
import { getAllPersonTags } from '@/app/persons/tags/actions';
import PersonDetailClient from './person-detail-client';

export const revalidate = 0;

interface Props { params: { personId: string } }

async function fetchData(id: number) {
  const [person, tagCatalog] = await Promise.all([
    getPerson(id),
    getAllPersonTags(),
  ]);
  return { person, tagCatalog };
}

export default async function PersonDetailPage({ params }: Props) {
  const id = Number(params.personId); if (!id || Number.isNaN(id)) return notFound();
  let personData: any = null; let allTags: { name: string }[] = [];
  try {
    const { person, tagCatalog } = await fetchData(id);
    if (!person) return notFound();
    personData = person;
    allTags = (tagCatalog || []).map((t: any) => ({ name: t.name })).sort((a,b)=>a.name.localeCompare(b.name));
  } catch (e: any) { return <p className="text-sm text-red-600">Failed to load person: {e.message}</p>; }
  return <div className="space-y-6">
    <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Persons', href: '/persons' }, { label: `Person ${id}` }]} />
    <PersonDetailClient initial={{ id, name: personData.name || `Person ${id}`, status: personData.status, type: personData.type, tagNames: (personData.tags || []).map((t:any)=>t.name) }} availableTags={allTags} onSubmit={updatePerson} onArchive={deletePerson} />
  </div>;
}
