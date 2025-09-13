"use client";
import Badges from "@/components/badges";
import { PencilIcon, ViewIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ITEM_STATUS_VALUES, type ItemStatus } from "@/lib/db/schema";
import Link from "next/link";
import { useState, useTransition } from "react";

export interface ItemDetailInitialValues {
  id: number;
  description: string;
  status: ItemStatus;
  sellPrice: number;
  unique: boolean;
  tagNames: string[];
  components: number[];
}

interface TagOption {
  name: string;
}
interface ComponentOption {
  id: number;
  description: string | null;
}

interface Props {
  initial: ItemDetailInitialValues;
  availableTags: TagOption[];
  availableComponents: ComponentOption[];
  onSubmit: (fd: FormData) => Promise<void>;
  onArchive?: (fd: FormData) => Promise<void>;
  defaultEditMode?: boolean;
  forceReadOnly?: boolean; // overrides edit mode toggle
}

const EDITABLE_STATUS_OPTIONS = ITEM_STATUS_VALUES.filter(
  (s): s is ItemStatus => s !== "archived"
);

export default function ItemDetailClient({
  initial,
  availableTags,
  availableComponents,
  onSubmit,
  onArchive,
  defaultEditMode = false,
  forceReadOnly = false,
}: Props) {
  const [editMode, setEditMode] = useState(defaultEditMode);
  const effectiveDisabled = forceReadOnly || !editMode;

  // local form state (from former InlineItemForm)
  const [description, setDescription] = useState(initial.description);
  const [status, setStatus] = useState<ItemStatus>(initial.status);
  const [sellPrice, setSellPrice] = useState<number>(initial.sellPrice);
  const [unique, setUnique] = useState<boolean>(initial.unique);
  const [tagNames, setTagNames] = useState<string[]>(initial.tagNames);
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(fd: FormData) {
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
  }

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
          disabled={forceReadOnly}
        >
          {editMode ? (
            <ViewIcon className="w-3.5 h-3.5" />
          ) : (
            <PencilIcon className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
      <div className="pr-20">
        <Form action={handleSubmit} className="space-y-4">
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
              autoFocus={editMode}
              disabled={effectiveDisabled}
            />
            <Form.NumberInput
              name="sellPrice"
              label="Sell Price"
              id={`sellPrice-${initial.id}`}
              step="0.01"
              min={0}
              value={sellPrice}
              onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)}
              disabled={effectiveDisabled}
            />
            <Form.CheckboxInput
              name="unique"
              label="Unique"
              id={`unique-${initial.id}`}
              checked={unique}
              onChange={(e) => setUnique(e.target.checked)}
              disabled={effectiveDisabled}
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
              disabled={effectiveDisabled}
            />
          </div>

          {effectiveDisabled ? (
            <Badges
              unique={unique}
              status={status}
              componentsCount={initial.components.length}
              tags={tagNames.map((name) => ({ name }))}
              className="pt-1 text-xs"
            />
          ) : (
            <>
              <Form.Tags
                name="tags"
                options={availableTags.map((t) => ({
                  value: t.name,
                  label: t.name,
                }))}
                value={tagNames}
                onValueChange={(vals) => setTagNames(vals as string[])}
                disabled={effectiveDisabled}
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
            </>
          )}

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
            disabled={effectiveDisabled}
          />

          <div className="flex items-center justify-between gap-4 pt-2">
            <div className="text-xs text-muted-foreground space-x-3">
              {isPending && <span>Saving...</span>}
              {savedAt && !isPending && (
                <span className="text-green-600">Saved</span>
              )}
              {error && <span className="text-red-600">{error}</span>}
            </div>
            <div className="flex gap-2">
              {onArchive && !effectiveDisabled && (
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
                        /* no-op */
                      }
                    });
                  }}
                >
                  Archive
                </Button>
              )}
              {!effectiveDisabled && (
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
