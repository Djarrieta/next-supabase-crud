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
import type { Item, ItemStatus } from "@/lib/db/schema";
import { ITEM_STATUS_VALUES } from "@/lib/db/schema";
import { useState } from "react";

type InitialValues = {
  description: string;
  status?: Item["status"];
  sellPrice?: number;
  unique?: Item["unique"];
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
  } = initialValues;
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initialDescription);
  const [status, setStatus] = useState<ItemStatus>(initialStatus);
  const [sellPrice, setSellPrice] = useState<number>(initialSellPrice);
  const [unique, setUnique] = useState<boolean>(initialUnique);
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
            <label
              htmlFor={`status-${id}`}
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Status
            </label>
            <select
              id={`status-${id}`}
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ItemStatus)}
              className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            >
              {EDITABLE_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
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
