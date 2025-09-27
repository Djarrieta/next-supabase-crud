"use client";
import { useState } from "react";
import { DetailShell } from "@/components/detail-shell";
import { useDetailSave } from "@/lib/use-detail-save";
import { Form } from "@/components/ui/form";
import {
  PROJECT_STATUS_VALUES,
  type ProjectStatus,
} from "@/app/projects/schema";

interface Props {
  initial: {
    id: number;
    name: string;
    description: string;
    status: ProjectStatus;
    personId: number;
    personName?: string;
  };
  onSubmit: (fd: FormData) => Promise<void>;
  onArchive?: (fd: FormData) => Promise<void>;
}

const EDITABLE_STATUS = PROJECT_STATUS_VALUES.filter((s) => s !== "archived");

export default function ProjectDetailClient({
  initial,
  onSubmit,
  onArchive,
}: Props) {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description || "");
  const [status, setStatus] = useState<ProjectStatus>(initial.status);
  const [personId] = useState(initial.personId);
  const { runSave, isPending, savedAt, error } = useDetailSave();

  function handleSubmit(fd: FormData) {
    fd.append("id", String(initial.id));
    fd.set("name", name.trim());
    fd.set("description", description);
    fd.set("status", status);
    fd.set("personId", String(personId));
    runSave(() => onSubmit(fd));
  }

  return (
    <DetailShell
      editMode={editMode}
      onToggle={() => setEditMode((m) => !m)}
      isPending={isPending}
      savedAt={savedAt}
      error={error}
      onArchive={
        onArchive
          ? () => {
              const fd = new FormData();
              fd.append("id", String(initial.id));
              runSave(() => onArchive(fd), { recordTimestamp: false });
            }
          : undefined
      }
      formId={`project-detail-form-${initial.id}`}
    >
      <Form
        id={`project-detail-form-${initial.id}`}
        action={handleSubmit}
        className="space-y-6"
      >
        <input type="hidden" name="id" value={initial.id} />
        {editMode ? (
          <div className="space-y-4">
            <Form.TextInput
              name="name"
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              disabled={!editMode}
              autoFocus
            />
            <Form.TextInput
              name="description"
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              disabled={!editMode}
            />
            <Form.Selector
              name="status"
              label="Status"
              value={status}
              onValueChange={(v) => setStatus(v as ProjectStatus)}
              options={EDITABLE_STATUS.map((s) => ({ value: s, label: s }))}
              disabled={!editMode}
            />
            <div className="text-xs text-muted-foreground">
              Person:{" "}
              <span className="font-medium">
                {initial.personName || `#${initial.personId}`}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-3">
              <span>{name || `Project ${initial.id}`}</span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-muted uppercase tracking-wide text-muted-foreground">
                {status}
              </span>
            </h2>
            <p className="text-sm text-muted-foreground whitespace-pre-line min-h-[1rem]">
              {description || (
                <span className="italic opacity-70">No description</span>
              )}
            </p>
            <div className="text-xs text-muted-foreground">
              Person:{" "}
              <span className="font-medium">
                {initial.personName || `#${initial.personId}`}
              </span>
            </div>
          </div>
        )}
      </Form>
    </DetailShell>
  );
}
