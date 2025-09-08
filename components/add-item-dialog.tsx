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
import { ITEM_TAG_VALUES } from "@/lib/db/schema";

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
          <div className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tags
            </span>
            <div className="flex flex-wrap gap-3">
              {ITEM_TAG_VALUES.map((tag) => (
                <label key={tag} className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    name="tags"
                    value={tag}
                    className="h-4 w-4 rounded border"
                  />
                  <span>{tag}</span>
                </label>
              ))}
            </div>
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
