"use client";
import { useRouter, useSearchParams } from "next/navigation";
import type { ItemStatus } from "@/lib/db/schema";
import { useTransition } from "react";
import { Selector } from "./ui/selector";

const options: { value: ItemStatus | "all"; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "all", label: "All" },
];

export default function StatusFilter({
  current,
}: {
  current: ItemStatus | "all";
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function onChange(val: string) {
    const sp = new URLSearchParams(params.toString());
    // Reset pagination when filter changes
    if (sp.has("page")) sp.delete("page");
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
    <Selector
      value={current}
      options={options}
      onValueChange={onChange}
      disabled={isPending}
      size="sm"
    />
  );
}
