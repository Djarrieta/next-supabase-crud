import { notFound } from "next/navigation";
import Breadcrumb from "@/components/breadcrumb";
import { getPerson, updatePerson, deletePerson } from "@/app/persons/actions";
import PersonDetailClient from "./person-detail-client";
import { Suspense } from "react";
import DetailSkeleton from "@/components/detail-skeleton";

export const revalidate = 5;

interface Props {
  params: { personId: string };
}

async function PersonDetailContent({ id }: { id: number }) {
  const person = await getPerson(id);
  if (!person) return notFound();
  return (
    <PersonDetailClient
      initial={{
        id,
        name: (person as any).name || `Person ${id}`,
        status: (person as any).status,
        type: (person as any).type,
        tagNames: ((person as any).tags || []).map((t: any) => t.name),
      }}
      availableTags={[]}
      onSubmit={updatePerson}
      onArchive={deletePerson}
    />
  );
}

export default function PersonDetailPage({ params }: Props) {
  const id = Number(params.personId);
  if (!id || Number.isNaN(id)) return notFound();
  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Persons", href: "/persons" },
          { label: `Person ${id}` },
        ]}
      />
      <Suspense fallback={<DetailSkeleton />}>
        <PersonDetailContent id={id} />
      </Suspense>
    </div>
  );
}
