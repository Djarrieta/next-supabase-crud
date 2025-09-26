"use client";
import Badges from "@/components/badges";
import { PencilIcon, ViewIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ITEM_STATUS_VALUES, type ItemStatus } from "@/lib/db/schema";
import AsyncItemMultiSelect from "@/components/async-item-multiselect";
import Link from "next/link";
import { useState, useTransition, useEffect } from "react";

export interface ItemDetailInitialValues {
  id: number;
  name: string;
  description: string;
  status: ItemStatus;
  sellPrice: number;
  purchasePrice: number;
  rentPrice: number;
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
}: Props) {
  const [editMode, setEditMode] = useState(true);

  // local form state (from former InlineItemForm)
  const [description, setDescription] = useState(initial.description);
  const [name, setName] = useState<string>(initial.name || "");
  const [status, setStatus] = useState<ItemStatus>(initial.status);
  const [sellPrice, setSellPrice] = useState<number>(initial.sellPrice);
  const [purchasePrice, setPurchasePrice] = useState<number>(
    initial.purchasePrice
  );
  const [rentPrice, setRentPrice] = useState<number>(initial.rentPrice);
  const [unique, setUnique] = useState<boolean>(initial.unique);
  const [tagNames, setTagNames] = useState<string[]>(initial.tagNames);
  const [tagOptions, setTagOptions] = useState<TagOption[]>(
    availableTags.length
      ? availableTags
      : Array.from(new Set(initial.tagNames)).map((n) => ({ name: n }))
  );
  const [components, setComponents] = useState<number[]>(
    initial.components.filter((c) => c !== initial.id)
  );
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(fd: FormData) {
    fd.append("id", String(initial.id));
    fd.set("name", name.trim());
    fd.append("status", status);
    fd.set("sellPrice", String(sellPrice));
    fd.set("purchasePrice", String(purchasePrice));
    fd.set("rentPrice", String(rentPrice));
    fd.set("unique", unique ? "true" : "false");
    fd.append("_tags_present", "1");
    fd.append("_components_present", "1");
    // ensure existing components state serialized (hidden inputs already emitted by component component but keep for clarity)
    components.forEach((c) => fd.append("components", String(c)));
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

  useEffect(() => {
    if (tagOptions.length === 0) {
      fetch("/api/items/tags")
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
                  id={`name-${initial.id}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Short name"
                  maxLength={120}
                  autoFocus
                  disabled={!editMode}
                />
                <Form.TextInput
                  name="description"
                  label="Description"
                  id={`description-${initial.id}`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Item description"
                  maxLength={500}
                  disabled={!editMode}
                />
                <div className="grid gap-4 md:grid-cols-2">
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
                    disabled={!editMode}
                  />
                  <Form.CheckboxInput
                    name="unique"
                    label="Unique"
                    id={`unique-${initial.id}`}
                    checked={unique}
                    onChange={(e) => setUnique(e.target.checked)}
                    disabled={!editMode}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Pricing
                  </label>
                  <div className="grid gap-4 sm:grid-cols-3 rounded-md border p-4 bg-muted/30">
                    <Form.NumberInput
                      name="sellPrice"
                      label="Sell"
                      id={`sellPrice-${initial.id}`}
                      step="0.01"
                      min={0}
                      value={sellPrice}
                      onChange={(e) =>
                        setSellPrice(parseFloat(e.target.value) || 0)
                      }
                      disabled={!editMode}
                    />
                    <Form.NumberInput
                      name="purchasePrice"
                      label="Purchase"
                      id={`purchasePrice-${initial.id}`}
                      step="0.01"
                      min={0}
                      value={purchasePrice}
                      onChange={(e) =>
                        setPurchasePrice(parseFloat(e.target.value) || 0)
                      }
                      disabled={!editMode}
                    />
                    <Form.NumberInput
                      name="rentPrice"
                      label="Rent"
                      id={`rentPrice-${initial.id}`}
                      step="0.01"
                      min={0}
                      value={rentPrice}
                      onChange={(e) =>
                        setRentPrice(parseFloat(e.target.value) || 0)
                      }
                      disabled={!editMode}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Form.Tags
                    name="tags"
                    options={tagOptions.map((t) => ({
                      value: t.name,
                      label: t.name,
                    }))}
                    value={tagNames}
                    onValueChange={(vals) => setTagNames(vals as string[])}
                    disabled={!editMode}
                  />
                  <div className="-mt-1 mb-2 text-xs text-muted-foreground">
                    Need to add or edit tags?{" "}
                    <Link
                      href="/items/tags"
                      className="underline underline-offset-2 hover:text-primary"
                    >
                      Manage tags
                    </Link>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <AsyncItemMultiSelect
                  name="components"
                  label="Components (items)"
                  itemId={initial.id}
                  value={components}
                  onChange={setComponents}
                  disabled={!editMode}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold flex items-center gap-3">
                  <span>{name || `Item ${initial.id}`}</span>
                  <Badges
                    unique={unique}
                    status={status}
                    componentsCount={initial.components.length}
                    tags={tagNames.map((n) => ({ name: n }))}
                    className="text-[10px] space-x-1"
                  />
                </h2>
                <p className="text-sm text-muted-foreground whitespace-pre-line min-h-[1rem]">
                  {description || (
                    <span className="italic opacity-70">No description</span>
                  )}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Pricing
                </label>
                <div className="grid gap-4 sm:grid-cols-3 rounded-md border p-4 bg-muted/30 text-sm">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                      Sell
                    </div>
                    <div className="font-medium">{sellPrice.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                      Purchase
                    </div>
                    <div className="font-medium">
                      {purchasePrice.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                      Rent
                    </div>
                    <div className="font-medium">{rentPrice.toFixed(2)}</div>
                  </div>
                </div>
              </div>
              {initial.components.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    SubComponents
                  </label>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {initial.components
                      .filter((c) => c !== initial.id)
                      .map((cid) => (
                        <span
                          key={cid}
                          className="rounded bg-muted px-2 py-1 font-mono text-[10px]"
                        >
                          #{cid}
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
                      } catch (e) {
                        /* no-op */
                      }
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
