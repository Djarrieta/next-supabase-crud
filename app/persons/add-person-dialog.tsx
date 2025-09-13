"use client";
import { Button } from "@/components/ui/button";
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
import Link from "next/link";
import { useState } from "react";

// Tag names selected are resolved to tag ids server-side.
interface TagOption {
  name: string;
}
interface ComponentOption {
  id: number;
  name: string | null;
}
interface Props {
  action: (formData: FormData) => Promise<void>;
  availableTags: TagOption[];
  availableComponents: ComponentOption[];
}

export default function AddPersonDialog({
  action,
  availableTags,
  availableComponents,
}: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary">New Person</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Person</DialogTitle>
          <DialogDescription>Add a new person.</DialogDescription>
        </DialogHeader>
        <Form
          action={async (fd) => {
            await action(fd);
            setOpen(false);
          }}
        >
          <Form.TextInput
            name="name"
            label="Name"
            placeholder="Full name"
            maxLength={200}
            autoFocus
          />
          <Form.Tags
            name="tags"
            options={availableTags.map((t) => ({
              value: t.name,
              label: t.name,
            }))}
          />
          <div className="-mt-2 mb-2 text-xs text-muted-foreground">
            Need to add or edit tags?{" "}
            <Link
              href="/persons/tags"
              className="underline underline-offset-2 hover:text-primary"
            >
              Manage tags
            </Link>
          </div>
          <Form.MultiSelect
            name="components"
            label="Components (other persons)"
            options={availableComponents.map((c) => ({
              value: c.id,
              label: `${c.id} – ${c.name || "Unnamed"}`.slice(0, 60),
            }))}
          />
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
