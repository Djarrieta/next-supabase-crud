"use client";
import { useState, useTransition } from "react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import Link from "next/link";
import type { Item, ItemStatus } from "@/lib/db/schema";
import { ITEM_STATUS_VALUES } from "@/lib/db/schema";

export type InlineItemFormInitialValues = {
  id: number;
  description: string;
  status: ItemStatus;
  sellPrice: number;
  unique: boolean;
  tagNames: string[];
  components: number[];
};

interface TagOption {
  name: string;
}
interface ComponentOption {
  id: number;
  description: string | null;
}

interface Props {
  initial: InlineItemFormInitialValues;
  availableTags: TagOption[];
  availableComponents: ComponentOption[];
  onSubmit: (fd: FormData) => Promise<void>;
  onArchive?: (fd: FormData) => Promise<void>;
}

const EDITABLE_STATUS_OPTIONS = ITEM_STATUS_VALUES.filter(
  (s): s is ItemStatus => s !== "archived"
);

export default function InlineItemForm({
  initial,
  availableTags,
  availableComponents,
  onSubmit,
  onArchive,
}: Props) {
  const [description, setDescription] = useState(initial.description);
  const [status, setStatus] = useState<ItemStatus>(initial.status);
  const [sellPrice, setSellPrice] = useState<number>(initial.sellPrice);
  const [unique, setUnique] = useState<boolean>(initial.unique);
  const [tagNames, setTagNames] = useState<string[]>(initial.tagNames);
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <Form
      action={(fd) => {
        fd.append("id", String(initial.id));
        fd.append("status", status);
        fd.set("sellPrice", String(sellPrice));
        fd.set("unique", unique ? "true" : "false");
        fd.append("_tags_present", "1");
        fd.append("_components_present", "1");
        setError(null);
        startTransition(async () => {
          try {
            await onSubmit(fd);
            setSavedAt(Date.now());
          } catch (e: any) {
            setError(e.message || "Save failed");
          }
        });
      }}
      className="space-y-4"
    >
      <input type="hidden" name="id" value={initial.id} />
      <div className="grid gap-4 md:grid-cols-2">
        <Form.TextInput
          name="description"
          label="Description"
          id={`description-${initial.id}`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Item description"
          maxLength={500}
          autoFocus
        />
        <Form.NumberInput
          name="sellPrice"
          label="Sell Price"
          id={`sellPrice-${initial.id}`}
          step="0.01"
          min={0}
          value={sellPrice}
          onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)}
        />
        <Form.CheckboxInput
          name="unique"
          label="Unique"
          id={`unique-${initial.id}`}
          checked={unique}
          onChange={(e) => setUnique(e.target.checked)}
        />
        <Form.Selector
          id={`status-${initial.id}`}
          name="status"
          label="Status"
          value={status}
          onValueChange={(v) => setStatus(v as ItemStatus)}
          options={EDITABLE_STATUS_OPTIONS.map((s) => ({
            value: s,
            label: s.charAt(0).toUpperCase() + s.slice(1),
          }))}
        />
      </div>

      <Form.Tags
        name="tags"
        options={availableTags.map((t) => ({ value: t.name, label: t.name }))}
        value={tagNames}
        onValueChange={(vals) => setTagNames(vals as string[])}
      />
      <div className="-mt-2 mb-2 text-xs text-muted-foreground">
        Need to add or edit tags?{" "}
        <Link
          href="/items/tags"
          className="underline underline-offset-2 hover:text-primary"
        >
          Manage tags
        </Link>
      </div>

      <Form.MultiSelect
        name="components"
        label="Components (other items)"
        initialValue={initial.components.filter((c) => c !== initial.id)}
        options={availableComponents
          .filter((c) => c.id !== initial.id)
          .map((c) => ({
            value: c.id,
            label: `${c.id} – ${c.description || "Untitled"}`.slice(0, 60),
          }))}
      />

      <div className="flex flex-wrap gap-1 pt-1 text-xs">
        {tagNames.map((n) => (
          <Tag key={n}>{n}</Tag>
        ))}
        {initial.components.length > 0 && (
          <Tag variant="warning">{initial.components.length} comps</Tag>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="text-xs text-muted-foreground space-x-3">
          {isPending && <span>Saving...</span>}
          {savedAt && !isPending && (
            <span className="text-green-600">Saved</span>
          )}
          {error && <span className="text-red-600">{error}</span>}
        </div>
        <div className="flex gap-2">
          {onArchive && (
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
                  } catch (e) {
                    /* handled in server logs */
                  }
                });
              }}
            >
              Archive
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            variant="primary"
            disabled={isPending}
          >
            Save
          </Button>
        </div>
      </div>
    </Form>
  );
}
