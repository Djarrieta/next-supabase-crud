"use client";
import { cn } from "@/lib/utils";
import { useRef, useState, useEffect } from "react";
import { useItemsFilters } from "../app/items/use-items-filters";
import { CloseIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";

export default function ItemsFilterInput({
  className,
}: {
  className?: string;
}) {
  const { tokens, addRaw, removeAt, apply, reset } = useItemsFilters();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto‑apply whenever tokens change (debounced slightly to batch rapid edits)
  useEffect(() => {
    const handle = setTimeout(() => {
      apply();
    }, 150);
    return () => clearTimeout(handle);
  }, [tokens, apply]);

  const commit = (raw: string) => {
    addRaw(raw);
    setInput("");
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded border bg-background text-xs px-2 py-1 min-w-[400px]",
        className
      )}
    >
      {/* Top row: tokens + input */}
      <div className="flex items-center gap-2 flex-wrap max-h-20 overflow-y-auto pr-1">
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
          className="flex-1 min-w-[200px] bg-transparent outline-none placeholder:text-muted-foreground"
          placeholder="Type filter then Enter (id:5 tag:2 unique:true)"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Reset filters"
          title="Reset filters"
          onClick={() => {
            reset();
            setInput("");
          }}
          className="p-1 w-7 h-7 px-1 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <CloseIcon className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
