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

type Props = {
  action: (formData: FormData) => Promise<void>;
  deleteAction?: (formData: FormData) => Promise<void>;
  id: number;
  initialDescription: string;
  initialStatus?: string;
};

export default function EditItemDialog({
  action,
  deleteAction,
  id,
  initialDescription,
  initialStatus = "active",
}: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initialDescription);
  const [status, setStatus] = useState(initialStatus);
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setValue(initialDescription);
          setStatus(initialStatus);
        }
      }}
    >
      <DialogTrigger asChild>
        <button className="inline-flex h-7 items-center rounded-md border bg-background px-2 text-xs font-medium shadow-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Edit
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>Update the existing record.</DialogDescription>
        </DialogHeader>
        <form
          action={async (fd) => {
            fd.append("id", String(id));
            fd.append("status", status);
            await action(fd);
            setOpen(false);
          }}
          className="space-y-4 pt-2"
        >
          <input type="hidden" name="id" value={id} />
          <div className="space-y-2">
            <label
              htmlFor={`description-${id}`}
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Description
            </label>
            <input
              id={`description-${id}`}
              name="description"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Item description"
              className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              maxLength={500}
              autoFocus
            />
          </div>
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
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            {deleteAction && (
              <button
                type="button"
                onClick={async () => {
                  const fd = new FormData();
                  fd.append("id", String(id));
                  await deleteAction(fd);
                  setOpen(false);
                }}
                className="inline-flex h-9 items-center rounded-md border border-destructive/50 bg-destructive/10 px-3 text-sm font-medium text-destructive shadow-sm hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Archive
              </button>
            )}
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
