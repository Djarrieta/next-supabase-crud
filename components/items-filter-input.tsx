"use client";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { useItemsFilters } from "../app/items/use-items-filters";

export default function ItemsFilterInput({
  className,
}: {
  className?: string;
}) {
  const { tokens, addRaw, removeAt, apply, reset } = useItemsFilters();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const commit = (raw: string) => {
    addRaw(raw);
    setInput("");
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 flex-wrap min-h-9 px-2 py-1 rounded border bg-background text-xs",
        className
      )}
    >
      {tokens.map((t, i) => (
        <button
          key={i}
          type="button"
          onClick={() => removeAt(i)}
          className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 hover:bg-muted/70"
        >
          <span className="font-medium">{t.key}:</span>
          <span className="truncate max-w-[120px]">{t.value}</span>
          <span className="text-muted-foreground">×</span>
        </button>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(input);
          } else if (e.key === "Backspace" && !input && tokens.length) {
            removeAt(tokens.length - 1);
          }
        }}
        className="flex-1 min-w-[140px] bg-transparent outline-none placeholder:text-muted-foreground"
        placeholder="Add filter (e.g. id:5 name:foo tag:2 unique:true)"
      />
      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={() => commit(input)}
          className="rounded border px-2 py-0.5 hover:bg-accent"
        >
          Add
        </button>
        <button
          type="button"
          onClick={apply}
          className="rounded border px-2 py-0.5 hover:bg-accent"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={() => {
            reset();
            setInput("");
          }}
          className="rounded border px-2 py-0.5 hover:bg-accent"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
