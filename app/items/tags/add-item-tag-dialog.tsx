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
type Props = { action: (formData: FormData) => Promise<void> };

export default function AddItemTagDialog({ action }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary">New Tag</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Tag</DialogTitle>
          <DialogDescription>Add a new tag.</DialogDescription>
        </DialogHeader>
        <Form
          action={async (fd) => {
            await action(fd);
            setOpen(false);
          }}
        >
          <div className="space-y-4">
            <Form.TextInput
              name="name"
              label="Name"
              placeholder="Tag name"
              maxLength={200}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
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
