"use client";
import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";

export interface AddEntityDialogProps {
  /** Text of the trigger button */
  triggerLabel: string;
  /** Dialog title */
  title: string;
  /** Dialog short description */
  description?: string;
  /** Action to execute (server action / form action) */
  action: (fd: FormData) => Promise<void> | void;
  /** Children are the form fields */
  children: ReactNode;
  /** Optional footer override; receives a function to close the dialog */
  footer?: (opts: { close: () => void }) => ReactNode;
  /** Variant for trigger button (forwarded to Button) */
  triggerVariant?: React.ComponentProps<typeof Button>["variant"];
  /** Additional className on DialogContent */
  contentClassName?: string;
}

/** Generic reusable AddEntityDialog for create flows. */
export function AddEntityDialog({
  triggerLabel,
  title,
  description = "Add a new record.",
  action,
  children,
  footer,
  triggerVariant = "primary",
  contentClassName,
}: AddEntityDialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant}>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className={contentClassName}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <Form
          action={async (fd) => {
            await action(fd);
            setOpen(false);
          }}
        >
          {children}
          {footer ? (
            footer({ close: () => setOpen(false) })
          ) : (
            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>
              <Button variant="primary" type="submit">
                Save
              </Button>
            </div>
          )}
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default AddEntityDialog;
