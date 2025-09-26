"use client";
import { Form } from "@/components/ui/form";
import Link from "next/link";
import AddEntityDialog from "@/components/add-entity-dialog";

interface TagOption {
  name: string;
}
interface Props {
  action: (fd: FormData) => Promise<void>;
  availableTags: TagOption[];
}

export default function AddPersonDialog({ action, availableTags }: Props) {
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
        options={availableTags.map((t) => ({ value: t.name, label: t.name }))}
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
