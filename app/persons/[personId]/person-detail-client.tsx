"use client";
import { Form } from "@/components/ui/form";
import { PERSON_STATUS_VALUES, PERSON_TYPE_VALUES } from "@/app/persons/schema";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useTagOptions } from "@/lib/use-tag-options";
import { DetailShell } from "@/components/detail-shell";

interface TagOption {
  name: string;
}
interface Props {
  initial: {
    id: number;
    name: string;
    status: string;
    type: string;
    tagNames: string[];
  };
  availableTags: TagOption[];
  onSubmit: (fd: FormData) => Promise<void>;
  onArchive?: (fd: FormData) => Promise<void>;
}

const EDITABLE_STATUS = PERSON_STATUS_VALUES.filter((s) => s !== "archived");

export default function PersonDetailClient({
  initial,
  availableTags,
  onSubmit,
  onArchive,
}: Props) {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(initial.name);
  const [status, setStatus] = useState(initial.status);
  const [type, setType] = useState(initial.type);
  const [tagNames, setTagNames] = useState<string[]>(initial.tagNames);
  const tagOptions = useTagOptions({
    available: availableTags,
    initialNames: initial.tagNames,
    fetchPath: "/api/persons/tags",
  });
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(fd: FormData) {
    fd.append("id", String(initial.id));
    fd.set("name", name.trim());
    fd.set("status", status);
    fd.set("type", type);
    fd.append("_tags_present", "1");
    startTransition(async () => {
      setError(null);
      try {
        await onSubmit(fd);
        setSavedAt(Date.now());
      } catch (e: any) {
        setError(e.message || "Save failed");
      }
    });
  }

  // Tag loading handled by hook

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
              startTransition(async () => {
                try {
                  await onArchive(fd);
                } catch {}
              });
            }
          : undefined
      }
      formId={`person-detail-form-${initial.id}`}
    >
      <Form
        id={`person-detail-form-${initial.id}`}
        action={handleSubmit}
        className="space-y-6"
      >
        <input type="hidden" name="id" value={initial.id} />
        {editMode ? (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-4">
              <Form.TextInput
                name="name"
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={200}
                disabled={!editMode}
                autoFocus
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Form.Selector
                  name="status"
                  label="Status"
                  value={status}
                  onValueChange={(v) => setStatus(v)}
                  options={EDITABLE_STATUS.map((s) => ({
                    value: s,
                    label: s,
                  }))}
                  disabled={!editMode}
                />
                <Form.Selector
                  name="type"
                  label="Type"
                  value={type}
                  onValueChange={(v) => setType(v)}
                  options={PERSON_TYPE_VALUES.map((t) => ({
                    value: t,
                    label: t,
                  }))}
                  disabled={!editMode}
                />
              </div>
              <Form.Tags
                name="tags"
                value={tagNames}
                onValueChange={(vals) => setTagNames(vals as string[])}
                options={tagOptions.map((t) => ({
                  value: t.name,
                  label: t.name,
                }))}
                disabled={!editMode}
              />
              <div className="-mt-1 mb-2 text-xs text-muted-foreground">
                Need to add or edit tags?{" "}
                <Link
                  href="/persons/tags"
                  className="underline underline-offset-2 hover:text-primary"
                >
                  Manage tags
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold flex items-center gap-3">
                <span>{name || `Person ${initial.id}`}</span>
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-muted uppercase tracking-wide text-muted-foreground">
                  {status}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-muted uppercase tracking-wide text-muted-foreground">
                  {type}
                </span>
              </h2>
            </div>
            {tagNames.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 text-xs">
                  {tagNames.map((t) => (
                    <span
                      key={t}
                      className="rounded bg-muted px-2 py-1 font-mono text-[10px]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Form>
    </DetailShell>
  );
}
