"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export type TagVariant = "success" | "warning" | "error" | "default";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
}

const variantClasses: Record<TagVariant, string> = {
  success:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  warning:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",

  default: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium",
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
Tag.displayName = "Tag";

// Checkbox tag used inside forms
export interface TagCheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  value: string;
  children?: React.ReactNode; // label text
  className?: string; // applied to wrapper label
  inputClassName?: string; // applied to input element
}

export const TagCheckbox = React.forwardRef<HTMLInputElement, TagCheckboxProps>(
  ({ value, children, className, inputClassName, ...props }, ref) => {
    return (
      <label className={cn("flex items-center gap-1 text-xs", className)}>
        <input
          ref={ref}
          type="checkbox"
          value={value}
          className={cn("h-4 w-4 rounded border", inputClassName)}
          {...props}
        />
        <span>{children ?? value}</span>
      </label>
    );
  }
);
TagCheckbox.displayName = "TagCheckbox";

type PrimitiveOption = string;
interface ObjectOption {
  value: string;
  label?: string;
  disabled?: boolean;
}
export type TagOption = PrimitiveOption | ObjectOption;

function normalizeOption(o: TagOption): ObjectOption {
  if (typeof o === "string") return { value: o, label: o };
  return { value: o.value, label: o.label ?? o.value, disabled: o.disabled };
}

export interface TagGroupProps {
  name: string; // form field name for all checkboxes
  options: readonly TagOption[]; // accept readonly
  value?: string[]; // controlled selection
  defaultValue?: string[]; // uncontrolled initial selection
  onValueChange?: (values: string[]) => void;
  label?: string; // optional label above group
  wrapperClassName?: string; // outer wrapper (includes label)
  labelClassName?: string;
  groupClassName?: string; // flex container
  tagClassName?: string; // passed to each Tag wrapper
  tagInputClassName?: string; // passed to each Tag input
}

export const TagGroup = React.forwardRef<HTMLDivElement, TagGroupProps>(
  (
    {
      name,
      options,
      value,
      defaultValue,
      onValueChange,
      label,
      wrapperClassName,
      labelClassName,
      groupClassName,
      tagClassName,
      tagInputClassName,
    },
    ref
  ) => {
    const isControlled = Array.isArray(value);
    const [internal, setInternal] = React.useState<string[]>(
      defaultValue || []
    );
    const current = isControlled ? (value as string[]) : internal;

    function toggle(val: string, checked: boolean) {
      const next = checked
        ? [...current, val]
        : current.filter((v) => v !== val);
      if (!isControlled) setInternal(next);
      onValueChange?.(next);
    }

    return (
      <div ref={ref} className={cn("space-y-2", wrapperClassName)}>
        {label && (
          <span
            className={cn(
              "text-xs font-medium uppercase tracking-wide text-muted-foreground",
              labelClassName
            )}
          >
            {label}
          </span>
        )}
        <div className={cn("flex flex-wrap gap-3", groupClassName)}>
          {options.map((raw) => {
            const opt = normalizeOption(raw);
            const checked = current.includes(opt.value);
            return (
              <TagCheckbox
                key={opt.value}
                name={name}
                value={opt.value}
                disabled={opt.disabled}
                checked={checked}
                onChange={(e) => toggle(opt.value, e.target.checked)}
                className={tagClassName}
                inputClassName={tagInputClassName}
              >
                {opt.label}
              </TagCheckbox>
            );
          })}
        </div>
      </div>
    );
  }
);
TagGroup.displayName = "TagGroup";
export { Tag as default };
