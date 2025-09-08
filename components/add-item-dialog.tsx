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

export default function AddItemDialog({ action }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary">New Item</Button>
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
