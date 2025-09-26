"use client";
import AddEntityDialog from "@/components/add-entity-dialog";
import { Form } from "@/components/ui/form";

export default function AddPersonTagDialog({
  action,
}: {
  action: (fd: FormData) => Promise<void>;
}) {
  return (
    <AddEntityDialog
      triggerLabel="New Tag"
      title="New Tag"
      description="Add a new person tag."
      action={action}
    >
      <Form.TextInput
        name="name"
        label="Name"
        placeholder="Tag name"
        maxLength={120}
        autoFocus
        required
      />
    </AddEntityDialog>
  );
}
