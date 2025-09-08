"use client";
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
import { Button } from "@/components/ui/button";
import type { Item, ItemStatus, ItemTag } from "@/lib/db/schema";
import { ITEM_STATUS_VALUES, ITEM_TAG_VALUES } from "@/lib/db/schema";
import { useState } from "react";

type InitialValues = {
  description: string;
  status?: Item["status"];
  sellPrice?: number;
  unique?: Item["unique"];
  tags?: ItemTag[];
};

type Props = {
  action: (formData: FormData) => Promise<void>;
  deleteAction?: (formData: FormData) => Promise<void>;
  id: number;
  initialValues: InitialValues;
};

const EDITABLE_STATUS_OPTIONS = ITEM_STATUS_VALUES.filter(
  (s): s is ItemStatus => s !== "archived"
);

export default function EditItemDialog({
  action,
  deleteAction,
  id,
  initialValues,
}: Props) {
  const {
    description: initialDescription,
    status: initialStatus = "active",
    sellPrice: initialSellPrice = 0,
    unique: initialUnique = false,
    tags: initialTags = [],
  } = initialValues;
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initialDescription);
  const [status, setStatus] = useState<ItemStatus>(initialStatus);
  const [sellPrice, setSellPrice] = useState<number>(initialSellPrice);
  const [unique, setUnique] = useState<boolean>(initialUnique);
  const [tags, setTags] = useState<ItemTag[]>(initialTags);
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
            // Rely on native checkbox inputs for tag values; no manual append to avoid duplicates
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
          <div className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tags
            </span>
            <div className="flex flex-wrap gap-3">
              {ITEM_TAG_VALUES.map((tag) => {
                const checked = tags.includes(tag);
                return (
                  <label key={tag} className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      name="tags"
                      value={tag}
                      checked={checked}
                      onChange={(e) => {
                        setTags((prev) =>
                          e.target.checked
                            ? [...prev, tag]
                            : prev.filter((t) => t !== tag)
                        );
                      }}
                      className="h-4 w-4 rounded border"
                    />
                    <span>{tag}</span>
                  </label>
                );
              })}
            </div>
          </div>
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
