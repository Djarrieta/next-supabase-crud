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
import { useState } from "react";

type Props = { action: (formData: FormData) => Promise<void> };

export default function AddItemDialog({ action }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
          New Item
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Item</DialogTitle>
          <DialogDescription>Add a new record to the list.</DialogDescription>
        </DialogHeader>
        <Form
          action={async (fd) => {
            await action(fd);
            setOpen(false);
          }}
        >
          <Form.TextInput
            name="description"
            label="Description"
            placeholder="New item description"
            maxLength={500}
            autoFocus
          />
          <Form.NumberInput
            name="sellPrice"
            label="Sell Price"
            step="0.01"
            min={0}
            defaultValue={0}
          />
          <Form.CheckboxInput name="unique" label="Unique" />
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex h-9 items-center rounded-md border bg-background px-4 text-sm font-medium shadow-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cancel
              </button>
            </DialogClose>
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
