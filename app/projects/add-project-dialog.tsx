"use client";
import AddEntityDialog from "@/components/add-entity-dialog";
import { Form } from "@/components/ui/form";
import { useEffect, useState } from "react";

interface PersonOption {
  id: number;
  name: string;
}
interface Props {
  action: (fd: FormData) => Promise<void>;
  availablePersons: PersonOption[];
}

export default function AddProjectDialog({ action, availablePersons }: Props) {
  const [persons] = useState<PersonOption[]>(availablePersons);
  useEffect(() => {}, []); // placeholder if we later fetch more persons
  return (
    <AddEntityDialog
      triggerLabel="New Project"
      title="New Project"
      description="Add a new project."
      action={action}
    >
      <Form.TextInput
        name="name"
        label="Name"
        placeholder="Project name"
        maxLength={200}
        required
        autoFocus
      />
      <Form.TextInput
        name="description"
        label="Description"
        placeholder="Short description"
        maxLength={500}
      />
      <Form.Selector
        name="personId"
        label="Owner Person"
        required
        options={persons.map((p) => ({
          value: p.id,
          label: `${p.id} – ${p.name}`,
        }))}
      />
    </AddEntityDialog>
  );
}
