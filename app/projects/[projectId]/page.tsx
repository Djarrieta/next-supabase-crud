import Breadcrumb from "@/components/breadcrumb";
import { getProject, updateProject, deleteProject } from "../actions";
import ProjectDetailClient from "./project-detail-client";
import DetailSkeleton from "@/components/detail-skeleton";
import { Suspense } from "react";
import { notFound } from "next/navigation";

export const revalidate = 5;

export default function ProjectDetailPage({
  params,
}: {
  params: { projectId: string };
}) {
  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Projects", href: "/projects" },
          { label: `Project ${params.projectId}` },
        ]}
      />
      <Suspense fallback={<DetailSkeleton />}>
        {" "}
        <ProjectDetailLoader id={params.projectId} />{" "}
      </Suspense>
    </div>
  );
}

async function ProjectDetailLoader({ id }: { id: string }) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) return notFound();
  const proj = await getProject(numericId);
  if (!proj) return notFound();
  const initial = {
    id: (proj as any).id as number,
    name: (proj as any).name || "",
    description: (proj as any).description || "",
    status: (proj as any).status,
    personId: (proj as any).personId,
    personName: (proj as any).person?.name,
  };
  return (
    <ProjectDetailClient
      initial={initial}
      onSubmit={updateProject}
      onArchive={deleteProject}
    />
  );
}
