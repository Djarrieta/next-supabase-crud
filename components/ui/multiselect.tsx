"use client";
import { cn } from "@/lib/utils";
import {
  forwardRef,
  HTMLAttributes,
  useMemo,
  useState,
  useCallback,
} from "react";

export interface MultiSelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  name: string; // form field name (hidden inputs emitted)
  options: MultiSelectOption[];
  /** Controlled selection */
  value?: (string | number)[];
  /** Uncontrolled initial selection (renamed to avoid clash with intrinsic defaultValue) */
  initialValue?: (string | number)[];
  /** Called when selection changes */
  onValueChange?: (values: (string | number)[]) => void;
  /** Optional label text rendered above */
  label?: string;
  placeholder?: string;
  /** Virtual list height (px) */
  height?: number;
  /** Row height (px) */
  itemHeight?: number;
  overscan?: number; // rows above/below viewport
  /** Class overrides */
  wrapperClassName?: string; // outer container
  labelClassName?: string;
  listClassName?: string; // scrolling list container
  chipClassName?: string; // selected chip buttons
  searchInputClassName?: string;
  footerClassName?: string;
  /** Show small virtualization notice threshold */
  maxRenderedNotice?: number;
  /** Limit number of chips shown before summarizing */
  chipDisplayLimit?: number;
  disabled?: boolean; // disable interactions
}

const baseLabelClasses =
  "text-xs font-medium uppercase tracking-wide text-muted-foreground";
const baseInputClasses =
  "w-full rounded-md border px-3 py-2 text-sm bg-background";

export const MultiSelect = forwardRef<HTMLDivElement, MultiSelectProps>(
  (
    {
      name,
      options,
      value,
      initialValue,
      onValueChange,
      label,
      placeholder = "Search...",
      height = 240,
      itemHeight = 28,
      overscan = 6,
      wrapperClassName,
      labelClassName,
      listClassName,
      chipClassName,
      searchInputClassName,
      footerClassName,
      maxRenderedNotice = 5000,
      chipDisplayLimit = 20,
      className,
      disabled = false,
      ...rest
    },
    ref
  ) => {
    const isControlled = Array.isArray(value);
    const [internal, setInternal] = useState<(string | number)[]>(
      initialValue || []
    );
    const current = (isControlled ? value : internal) as (string | number)[];

    const [query, setQuery] = useState("");
    const [scrollTop, setScrollTop] = useState(0);

    const filtered = useMemo(() => {
      if (!query.trim()) return options;
      const q = query.toLowerCase();
      return options.filter((o) => o.label.toLowerCase().includes(q));
    }, [options, query]);

    const total = filtered.length;
    const viewportCount = Math.ceil(height / itemHeight);
    const startIndex = Math.min(
      total,
      Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    );
    const endIndex = Math.min(total, startIndex + viewportCount + overscan * 2);
    const slice = filtered.slice(startIndex, endIndex);

    const setSelection = useCallback(
      (next: (string | number)[]) => {
        if (!isControlled) setInternal(next);
        onValueChange?.(next);
      },
      [isControlled, onValueChange]
    );

    const toggle = (val: string | number) => {
      if (disabled) return;
      setSelection(
        current.includes(val)
          ? current.filter((v) => v !== val)
          : [...current, val]
      );
    };

    const clearAll = () => !disabled && setSelection([]);
    const selectAllFiltered = () =>
      !disabled &&
      setSelection([
        ...new Set([
          ...current,
          ...filtered.filter((o) => !o.disabled).map((o) => o.value),
        ]),
      ]);

    return (
      <div
        ref={ref}
        className={cn("space-y-2", wrapperClassName, className)}
        {...rest}
      >
        {label && (
          <span className={cn(baseLabelClasses, labelClassName)}>{label}</span>
        )}

        {current.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {current.slice(0, chipDisplayLimit).map((v) => {
              const opt = options.find((o) => o.value === v);
              if (!opt) return null;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggle(v)}
                  className={cn(
                    "group flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] hover:bg-muted/70",
                    chipClassName
                  )}
                  aria-label={`Remove ${opt.label}`}
                  disabled={disabled}
                >
                  <span className="truncate max-w-[140px]">{opt.label}</span>
                  <span className="text-muted-foreground group-hover:text-foreground">
                    ×
                  </span>
                </button>
              );
            })}
            {current.length > chipDisplayLimit && (
              <span className="text-[10px] text-muted-foreground">
                + {current.length - chipDisplayLimit} more
              </span>
            )}
            <button
              type="button"
              onClick={clearAll}
              className="text-[10px] underline text-muted-foreground hover:text-foreground ml-1"
              disabled={disabled}
            >
              Clear
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            className={cn(
              baseInputClasses,
              "h-8 text-xs",
              searchInputClassName
            )}
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              if (!disabled) {
                setQuery(e.target.value);
                setScrollTop(0);
              }
            }}
            aria-label="Filter options"
            disabled={disabled}
          />
          <button
            type="button"
            onClick={selectAllFiltered}
            className="rounded border px-2 text-[10px] hover:bg-accent disabled:opacity-40"
            disabled={filtered.length === 0 || disabled}
            title="Select all filtered"
          >
            All
          </button>
        </div>

        <div
          className={cn(
            "relative rounded border bg-background text-xs",
            listClassName
          )}
          style={{ height }}
        >
          <div
            onScroll={(e) =>
              setScrollTop((e.target as HTMLDivElement).scrollTop)
            }
            className="absolute inset-0 overflow-auto"
            role="listbox"
            aria-multiselectable="true"
          >
            <div style={{ height: total * itemHeight, position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  top: startIndex * itemHeight,
                  left: 0,
                  right: 0,
                }}
              >
                {slice.map((o) => {
                  const checked = current.includes(o.value);
                  return (
                    <label
                      key={o.value}
                      style={{ height: itemHeight }}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 px-2 hover:bg-accent/40",
                        checked ? "bg-accent/60" : "",
                        (o.disabled || disabled) &&
                          "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <input
                        type="checkbox"
                        className="h-3 w-3"
                        disabled={o.disabled || disabled}
                        checked={checked}
                        onChange={() => toggle(o.value)}
                      />
                      <span className="truncate flex-1">{o.label}</span>
                    </label>
                  );
                })}
                {total === 0 && (
                  <div className="p-2 text-muted-foreground">No results</div>
                )}
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none bg-gradient-to-t from-background to-transparent h-4" />
        </div>

        <div
          className={cn(
            "flex justify-between text-[10px] text-muted-foreground",
            footerClassName
          )}
        >
          <span>
            Showing {slice.length} of {total} (Selected {current.length})
          </span>
          {options.length > maxRenderedNotice && <span>Virtualized</span>}
        </div>

        {current.map((v) => (
          <input key={v} type="hidden" name={name} value={String(v)} />
        ))}
      </div>
    );
  }
);
MultiSelect.displayName = "MultiSelect";

export default MultiSelect;
