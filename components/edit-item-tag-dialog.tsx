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
import { useState } from "react";
import type { ItemTagRow } from "@/app/item-tags/domain/schema";

type Props = {
  id: number;
  initialName: string;
  action: (formData: FormData) => Promise<void>;
  deleteAction?: (formData: FormData) => Promise<void>;
};

export default function EditItemTagDialog({
  id,
  initialName,
  action,
  deleteAction,
}: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initialName);
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setValue(initialName);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Tag</DialogTitle>
          <DialogDescription>Update or delete this tag.</DialogDescription>
        </DialogHeader>
        <Form
          action={async (fd) => {
            fd.append("id", String(id));
            await action(fd);
            setOpen(false);
          }}
        >
          <input type="hidden" name="id" value={id} />
          <Form.TextInput
            name="name"
            id={`name-${id}`}
            label="Name"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Tag name"
            maxLength={200}
            autoFocus
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
                Delete
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
