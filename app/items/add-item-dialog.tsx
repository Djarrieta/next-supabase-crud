"use client";
import Link from "next/link";
import AddEntityDialog from "@/components/add-entity-dialog";
import { Form } from "@/components/ui/form";
// Tag names selected are resolved to tag ids (catalog) server-side.
type TagOption = { name: string };
type ComponentOption = { id: number; description: string | null };
type Props = {
  action: (formData: FormData) => Promise<void>;
  availableTags: TagOption[];
  availableComponents: ComponentOption[]; // existing items to select as components
};

export default function AddItemDialog({
  action,
  availableTags,
  availableComponents,
}: Props) {
  return (
    <AddEntityDialog
      triggerLabel="New Item"
      title="New Item"
      description="Add a new record to the list."
      action={action}
    >
      <Form.TextInput
        name="name"
        label="Name"
        placeholder="Item name"
        maxLength={120}
        autoFocus
        required
      />
      <Form.TextInput
        name="description"
        label="Description"
        placeholder="New item description"
        maxLength={500}
      />
      <div className="grid grid-cols-3 gap-4">
        <Form.NumberInput
          name="sellPrice"
          label="Sell Price"
          step="0.01"
          min={0}
          defaultValue={0}
        />
        <Form.NumberInput
          name="purchasePrice"
          label="Purchase Price"
          step="0.01"
          min={0}
          defaultValue={0}
        />
        <Form.NumberInput
          name="rentPrice"
          label="Rent Price"
          step="0.01"
          min={0}
          defaultValue={0}
        />
      </div>
      <Form.CheckboxInput name="unique" label="Unique" />
      <Form.Tags
        name="tags"
        options={availableTags.map((t) => ({ value: t.name, label: t.name }))}
      />
      <div className="-mt-2 mb-2 text-xs text-muted-foreground">
        Need to add or edit tags? {""}
        <Link
          href="/items/tags"
          className="underline underline-offset-2 hover:text-primary"
        >
          Manage tags
        </Link>
      </div>
      <Form.MultiSelect
        name="components"
        label="Components (other items)"
        options={availableComponents.map((c) => ({
          value: c.id,
          label: `${c.id} – ${c.description || "Untitled"}`.slice(0, 60),
        }))}
      />
    </AddEntityDialog>
  );
}
