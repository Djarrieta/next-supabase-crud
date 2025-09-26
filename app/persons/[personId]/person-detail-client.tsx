"use client";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { PencilIcon, ViewIcon } from "@/components/icons";
import { PERSON_STATUS_VALUES, PERSON_TYPE_VALUES } from "@/app/persons/schema";
import { useState, useTransition, useEffect } from "react";
import Link from "next/link";

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
  const [tagOptions, setTagOptions] = useState<TagOption[]>(
    availableTags.length
      ? availableTags
      : Array.from(new Set(initial.tagNames)).map((n) => ({ name: n }))
  );
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

  useEffect(() => {
    if (tagOptions.length === 0) {
      fetch("/api/persons/tags")
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data: { name: string }[]) =>
          setTagOptions((prev) =>
            prev.length ? prev : data.map((t) => ({ name: t.name }))
          )
        )
        .catch(() => {});
    }
  }, [tagOptions.length]);

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 flex items-center gap-2">
        <Button
          type="button"
          variant={editMode ? "primary" : "outline"}
          size="sm"
          onClick={() => setEditMode((m) => !m)}
          aria-pressed={editMode}
          className="flex items-center gap-1"
        >
          {editMode ? (
            <ViewIcon className="w-3.5 h-3.5" />
          ) : (
            <PencilIcon className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
      <div className="pr-20">
        <Form action={handleSubmit} className="space-y-6">
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
          <div className="flex items-center justify-between gap-4 pt-2">
            <div className="text-xs text-muted-foreground space-x-3">
              {isPending && <span>Saving...</span>}
              {editMode && savedAt && !isPending && (
                <span className="text-green-600">Saved</span>
              )}
              {error && <span className="text-red-600">{error}</span>}
            </div>
            <div className="flex gap-2">
              {onArchive && editMode && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const fd = new FormData();
                    fd.append("id", String(initial.id));
                    startTransition(async () => {
                      try {
                        await onArchive(fd);
                      } catch {}
                    });
                  }}
                >
                  Archive
                </Button>
              )}
              {editMode && (
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  disabled={isPending}
                >
                  Save
                </Button>
              )}
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
