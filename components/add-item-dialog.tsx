"use client";
import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

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
        <form
          action={async (fd) => {
            await action(fd);
            setOpen(false);
          }}
          className="space-y-4 pt-2"
        >
          <div className="space-y-2">
            <label
              htmlFor="description"
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Description
            </label>
            <input
              id="description"
              name="description"
              placeholder="New item description"
              className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              maxLength={500}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="sellPrice"
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Sell Price
            </label>
            <input
              id="sellPrice"
              name="sellPrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue="0"
              className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="unique"
              name="unique"
              type="checkbox"
              className="h-4 w-4 rounded border"
            />
            <label
              htmlFor="unique"
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Unique
            </label>
          </div>
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
