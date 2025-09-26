"use client";
import { Form } from "@/components/ui/form";
import Link from "next/link";
import AddEntityDialog from "@/components/add-entity-dialog";
import { useEffect, useState } from "react";

interface TagOption {
  name: string;
}
interface Props {
  action: (fd: FormData) => Promise<void>;
  availableTags: TagOption[];
}

export default function AddPersonDialog({ action, availableTags }: Props) {
  const [tags, setTags] = useState<TagOption[]>(availableTags);
  useEffect(() => {
    if (tags.length === 0) {
      fetch("/api/persons/tags")
        .then((r) =>
          r.ok ? r.json() : Promise.reject(new Error("Failed to load tags"))
        )
        .then((data: { name: string }[]) =>
          setTags(data.map((t) => ({ name: t.name })))
        )
        .catch(() => {});
    }
  }, [tags.length]);
  return (
    <AddEntityDialog
      triggerLabel="New Person"
      title="New Person"
      description="Add a new person."
      action={action}
    >
      <Form.TextInput
        name="name"
        label="Name"
        placeholder="Full name or legal entity"
        required
        maxLength={200}
        autoFocus
      />
      <Form.Selector
        name="type"
        label="Type"
        defaultValue="natural"
        options={[
          { value: "natural", label: "Natural" },
          { value: "legal", label: "Legal" },
        ]}
      />
      <Form.Tags
        name="tags"
        options={tags.map((t) => ({ value: t.name, label: t.name }))}
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
    </AddEntityDialog>
  );
}
