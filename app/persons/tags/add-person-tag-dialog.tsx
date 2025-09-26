"use client";
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { useState } from 'react';

export default function AddPersonTagDialog({ action }: { action: (fd: FormData)=>Promise<void> }) {
  const [open,setOpen]=useState(false);
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button variant="primary">New Tag</Button></DialogTrigger>
    <DialogContent>
      <DialogHeader><DialogTitle>New Tag</DialogTitle><DialogDescription>Add a new person tag.</DialogDescription></DialogHeader>
      <Form action={async fd => { await action(fd); setOpen(false); }}>
        <Form.TextInput name="name" label="Name" placeholder="Tag name" maxLength={120} autoFocus required />
        <div className="flex justify-end gap-2 pt-2">
          <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
          <Button variant="primary" type="submit">Save</Button>
        </div>
      </Form>
    </DialogContent>
  </Dialog>;
}
