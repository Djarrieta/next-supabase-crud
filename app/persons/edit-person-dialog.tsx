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
import { PERSON_STATUS_VALUES, PersonStatus } from "@/app/persons/schema";
import Link from "next/link";
import { useState } from "react";

interface InitialValues {
  name: string;
  status?: PersonStatus;
  tagNames?: string[];
  components?: number[];
}
interface TagOption {
  name: string;
}
interface ComponentOption {
  id: number;
  name: string | null;
}
interface Props {
  action: (formData: FormData) => Promise<void>;
  deleteAction?: (formData: FormData) => Promise<void>;
  id: number;
  initialValues: InitialValues;
  availableTags: TagOption[];
  availableComponents: ComponentOption[];
}

const EDITABLE_STATUS_OPTIONS = PERSON_STATUS_VALUES.filter(
  (s) => s !== "archived"
);

export default function EditPersonDialog({
  action,
  deleteAction,
  id,
  initialValues,
  availableTags,
  availableComponents,
}: Props) {
  const {
    name: initialName,
    status: initialStatus = "active",
    tagNames: initialTagNames = [],
    components: initialComponents = [],
  } = initialValues;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState<PersonStatus>(initialStatus);
  const [tagNames, setTagNames] = useState<string[]>(initialTagNames);
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setName(initialName);
          setStatus(initialStatus);
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
          <DialogTitle>Edit Person</DialogTitle>
          <DialogDescription>Update the existing record.</DialogDescription>
        </DialogHeader>
        <Form
          action={async (fd) => {
            fd.append("id", String(id));
            fd.append("status", status);
            fd.append("_tags_present", "1");
            fd.append("_components_present", "1");
            await action(fd);
            setOpen(false);
          }}
        >
          <input type="hidden" name="id" value={id} />
          <Form.TextInput
            name="name"
            label="Name"
            id={`name-${id}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            value={tagNames}
            onValueChange={(vals) => setTagNames(vals as string[])}
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
            initialValue={initialComponents.filter((c) => c !== id)}
            options={availableComponents
              .filter((c) => c.id !== id)
              .map((c) => ({
                value: c.id,
                label: `${c.id} – ${c.name || "Unnamed"}`.slice(0, 60),
              }))}
          />
          <Form.Selector
            id={`status-${id}`}
            name="status"
            label="Status"
            value={status}
            onValueChange={(v) => setStatus(v as PersonStatus)}
            options={EDITABLE_STATUS_OPTIONS.map((s) => ({
              value: s,
              label: s.charAt(0).toUpperCase() + s.slice(1),
            }))}
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
