"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import type { Item, ItemStatus } from "@/lib/db/schema";
import { ITEM_STATUS_VALUES } from "@/lib/db/schema";
import Link from "next/link";
import { useState } from "react";

type InitialValues = {
  description: string;
  status?: Item["status"];
  sellPrice?: number;
  unique?: Item["unique"];
  tagNames?: string[]; // selected tag names
  components?: number[]; // selected component item ids
};

type TagOption = { name: string };
type ComponentOption = { id: number; description: string | null };
type Props = {
  action: (formData: FormData) => Promise<void>;
  deleteAction?: (formData: FormData) => Promise<void>;
  id: number;
  initialValues: InitialValues;
  availableTags: TagOption[];
  availableComponents: ComponentOption[];
};

const EDITABLE_STATUS_OPTIONS = ITEM_STATUS_VALUES.filter(
  (s): s is ItemStatus => s !== "archived"
);

export default function EditItemDialog({
  action,
  deleteAction,
  id,
  initialValues,
  availableTags,
  availableComponents,
}: Props) {
  const {
    description: initialDescription,
    status: initialStatus = "active",
    sellPrice: initialSellPrice = 0,
    unique: initialUnique = false,
    tagNames: initialTagNames = [],
    components: initialComponents = [],
  } = initialValues;
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initialDescription);
  const [status, setStatus] = useState<ItemStatus>(initialStatus);
  const [sellPrice, setSellPrice] = useState<number>(initialSellPrice);
  const [unique, setUnique] = useState<boolean>(initialUnique);
  const [tagNames, setTagNames] = useState<string[]>(initialTagNames);
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setValue(initialDescription);
          setStatus(initialStatus);
          setSellPrice(initialSellPrice);
          setUnique(initialUnique);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>Update the existing record.</DialogDescription>
        </DialogHeader>
        <Form
          action={async (fd) => {
            fd.append("id", String(id));
            fd.append("status", status);
            fd.set("sellPrice", String(sellPrice));
            fd.set("unique", unique ? "true" : "false");
            fd.append("_tags_present", "1");
            fd.append("_components_present", "1");
            // Components mirrored via hidden inputs below
            await action(fd);
            setOpen(false);
          }}
        >
          <input type="hidden" name="id" value={id} />
          <Form.TextInput
            name="description"
            label="Description"
            id={`description-${id}`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Item description"
            maxLength={500}
            autoFocus
          />
          <Form.NumberInput
            name="sellPrice"
            label="Sell Price"
            id={`sellPrice-${id}`}
            step="0.01"
            min={0}
            value={sellPrice}
            onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)}
          />
          <Form.CheckboxInput
            name="unique"
            label="Unique"
            id={`unique-${id}`}
            checked={unique}
            onChange={(e) => setUnique(e.target.checked)}
          />
          <Form.Tags
            name="tags"
            options={availableTags.map((t) => ({
              value: t.name,
              label: t.name,
            }))}
            value={tagNames}
            onValueChange={(vals) => setTagNames(vals as string[])}
          />
          <div className="-mt-2 mb-2 text-xs text-muted-foreground">
            Need to add or edit tags? {""}
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
            initialValue={initialComponents.filter((c) => c !== id)}
            options={availableComponents
              .filter((c) => c.id !== id)
              .map((c) => ({
                value: c.id,
                label: `${c.id} – ${c.description || "Untitled"}`.slice(0, 60),
              }))}
          />

          <Form.Selector
            id={`status-${id}`}
            name="status"
            label="Status"
            value={status}
            onValueChange={(v) => setStatus(v as ItemStatus)}
            options={EDITABLE_STATUS_OPTIONS.map((s) => ({
              value: s,
              label: s.charAt(0).toUpperCase() + s.slice(1),
            }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            {deleteAction && (
              <Button
                variant="destructive"
                type="button"
                onClick={async () => {
                  const fd = new FormData();
                  fd.append("id", String(id));
                  await deleteAction(fd);
                  setOpen(false);
                }}
              >
                Archive
              </Button>
            )}
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="primary">
              Save
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
