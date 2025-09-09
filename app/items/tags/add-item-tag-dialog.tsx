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
import Selector from '@/components/ui/selector';

type ItemOption = { id: number; label: string };
type Props = { action: (formData: FormData) => Promise<void>; items: ItemOption[] };

export default function AddItemTagDialog({ action, items }: Props) {
  const [open, setOpen] = useState(false);
  const [itemId, setItemId] = useState(items[0]?.id ? String(items[0].id) : '');
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
        <Form action={async (fd) => { fd.append('itemId', itemId); await action(fd); setOpen(false); }}>
          <div className="space-y-4">
            <Selector
              label="Item"
              value={itemId}
              onValueChange={(v) => setItemId(v)}
              options={items.map(i => ({ value: i.id, label: i.label }))}
            />
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
