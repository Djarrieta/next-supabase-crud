"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const options = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "all", label: "All" },
];

export default function StatusFilter({ current }: { current: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    const sp = new URLSearchParams(params.toString());
    if (val === "active") {
      // default -> omit param for cleaner URL
      sp.delete("status");
    } else {
      sp.set("status", val);
    }
    startTransition(() => {
      router.replace("?" + sp.toString());
    });
  }

  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Status Filter
      </label>
      <select
        onChange={onChange}
        value={current}
        className="rounded-md border bg-background px-2 py-1.5 text-sm"
        disabled={isPending}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
