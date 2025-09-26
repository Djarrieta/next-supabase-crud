"use client";
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { PERSON_STATUS_VALUES, PERSON_TYPE_VALUES } from '@/app/persons/schema';
import { useState, useTransition } from 'react';
import Link from 'next/link';

interface TagOption { name: string }
interface Props { initial: { id: number; name: string; status: string; type: string; tagNames: string[] }; availableTags: TagOption[]; onSubmit: (fd: FormData)=>Promise<void>; onArchive?: (fd: FormData)=>Promise<void>; }

const EDITABLE_STATUS = PERSON_STATUS_VALUES.filter(s => s !== 'archived');

export default function PersonDetailClient({ initial, availableTags, onSubmit, onArchive }: Props) {
  const [name, setName] = useState(initial.name);
  const [status, setStatus] = useState(initial.status);
  const [type, setType] = useState(initial.type);
  const [tagNames, setTagNames] = useState<string[]>(initial.tagNames);
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(fd: FormData) {
    fd.append('id', String(initial.id));
    fd.set('name', name.trim());
    fd.set('status', status);
    fd.set('type', type);
    fd.append('_tags_present', '1');
    startTransition(async () => {
      setError(null);
      try { await onSubmit(fd); setSavedAt(Date.now()); } catch (e: any) { setError(e.message || 'Save failed'); }
    });
  }

  return <div className="space-y-6">
    <Form action={handleSubmit} className="space-y-6">
      <input type="hidden" name="id" value={initial.id} />
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <Form.TextInput name="name" label="Name" value={name} onChange={e=>setName(e.target.value)} maxLength={200} />
          <div className="grid gap-4 md:grid-cols-2">
            <Form.Selector name="status" label="Status" value={status} onValueChange={v=>setStatus(v)} options={EDITABLE_STATUS.map(s=>({ value: s, label: s }))} />
            <Form.Selector name="type" label="Type" value={type} onValueChange={v=>setType(v)} options={PERSON_TYPE_VALUES.map(t=>({ value: t, label: t }))} />
          </div>
          <Form.Tags name="tags" value={tagNames} onValueChange={vals=>setTagNames(vals as string[])} options={availableTags.map(t=>({ value: t.name, label: t.name }))} />
          <div className="-mt-1 mb-2 text-xs text-muted-foreground">Need to add or edit tags? <Link href="/persons/tags" className="underline underline-offset-2 hover:text-primary">Manage tags</Link></div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="text-xs text-muted-foreground space-x-3">{isPending && <span>Saving...</span>}{savedAt && !isPending && <span className="text-green-600">Saved</span>}{error && <span className="text-red-600">{error}</span>}</div>
        <div className="flex gap-2">
          {onArchive && <Button type="button" variant="destructive" size="sm" onClick={()=>{ const fd=new FormData(); fd.append('id', String(initial.id)); startTransition(async()=>{ try { await onArchive(fd);} catch {} }); }}>Archive</Button>}
          <Button type="submit" size="sm" variant="primary" disabled={isPending}>Save</Button>
        </div>
      </div>
    </Form>
  </div>;
}
