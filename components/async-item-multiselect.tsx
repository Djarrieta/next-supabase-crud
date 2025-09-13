"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { searchItemsForComponents } from "@/app/items/actions";

interface AsyncItemMultiSelectProps {
  name: string; // form field name (hidden inputs)
  label?: string;
  itemId: number; // current item id to exclude
  value: number[]; // controlled selection
  onChange: (ids: number[]) => void;
  disabled?: boolean;
  placeholder?: string;
  max?: number;
  className?: string;
}

interface Suggestion {
  id: number;
  name: string;
  description: string | null;
}

export function AsyncItemMultiSelect({
  name,
  label = "Components",
  itemId,
  value,
  onChange,
  disabled = false,
  placeholder = "Type id or name, press Enter…",
  max = 200,
  className,
}: AsyncItemMultiSelectProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [highlight, setHighlight] = useState(0);

  const effectiveExclude = [itemId, ...value];

  const runSearch = useCallback(
    async (q: string) => {
      setLoading(true);
      const res = await searchItemsForComponents(q, effectiveExclude, 25);
      setSuggestions(res);
      setLoading(false);
      setHighlight(0);
    },
    [effectiveExclude]
  );

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      runSearch(query).catch(() => {});
    }, 250);
  }, [query, runSearch]);

  function add(id: number) {
    if (disabled) return;
    if (!value.includes(id)) onChange([...value, id]);
    setQuery("");
    setSuggestions([]);
    setOpen(false);
  }
  function remove(id: number) {
    if (disabled) return;
    onChange(value.filter((v) => v !== id));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
      setOpen(true);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions[highlight]) {
        add(suggestions[highlight].id);
        return;
      }
      // Fallback: if the user typed a numeric id and it's not already selected, attempt to add via direct search.
      const numeric = Number(query.trim());
      if (
        query.trim() &&
        Number.isInteger(numeric) &&
        numeric > 0 &&
        !value.includes(numeric) &&
        numeric !== itemId
      ) {
        // optimistic add; server will validate on save
        onChange([...value, numeric]);
        setQuery("");
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  useEffect(() => {
    if (suggestions.length) setOpen(true);
  }, [suggestions.length]);

  useEffect(() => {
    if (open && listRef.current) {
      const el = listRef.current.querySelector<HTMLElement>(
        `[data-idx="${highlight}"]`
      );
      if (el) el.scrollIntoView({ block: "nearest" });
    }
  }, [highlight, open]);

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      )}
      <div className="flex flex-wrap gap-1 mb-1">
        {value.slice(0, max).map((id) => (
          <Button
            key={id}
            type="button"
            size="sm"
            variant="outline"
            className="h-auto px-2 py-0.5 text-[10px] bg-muted hover:bg-muted/70"
            onClick={() => remove(id)}
            disabled={disabled}
          >
            <span className="font-mono">#{id}</span>
            <span className="ml-1 opacity-60">×</span>
          </Button>
        ))}
        {value.length === 0 && (
          <span className="text-[10px] text-muted-foreground">None</span>
        )}
        {value.map((v) => (
          <input key={v} type="hidden" name={name} value={String(v)} />
        ))}
      </div>
      <div className="relative">
        <input
          type="text"
          className={cn(
            "w-full rounded-md border px-3 py-2 text-sm bg-background pr-10",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length && setOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        {loading && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
            …
          </span>
        )}
        {open && suggestions.length > 0 && (
          <div
            ref={listRef}
            className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow text-xs"
          >
            {suggestions.map((s, idx) => (
              <button
                type="button"
                key={s.id}
                data-idx={idx}
                onClick={() => add(s.id)}
                className={cn(
                  "flex w-full items-start gap-2 px-2 py-1 text-left hover:bg-accent/40",
                  idx === highlight && "bg-accent/60"
                )}
              >
                <span className="font-mono shrink-0 text-muted-foreground">
                  #{s.id}
                </span>
                <span className="flex-1 truncate">
                  {s.name || s.description || "Untitled"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AsyncItemMultiSelect;
