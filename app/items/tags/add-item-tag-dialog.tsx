"use client";
import AddEntityDialog from "@/components/add-entity-dialog";
import { Form } from "@/components/ui/form";

type Props = { action: (formData: FormData) => Promise<void> };

export default function AddItemTagDialog({ action }: Props) {
  return (
    <AddEntityDialog
      triggerLabel="New Tag"
      title="New Tag"
      description="Add a new tag."
      action={action}
    >
      <Form.TextInput
        name="name"
        label="Name"
        placeholder="Tag name"
        maxLength={200}
        autoFocus
        required
      />
    </AddEntityDialog>
  );
}
