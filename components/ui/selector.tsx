"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type SelectorVariant = "default" | "outline";
type SelectorSize = "default" | "sm";

export interface SelectorOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectorProps
  extends Omit<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    "onChange" | "size"
  > {
  options: SelectorOption[];
  /** Current value */
  value?: string | number;
  /** Change handler that receives the primitive value */
  onValueChange?: (value: string) => void;
  variant?: SelectorVariant;
  size?: SelectorSize; // custom visual size, not the native numeric "size" attribute
}

const variantClasses: Record<SelectorVariant, string> = {
  default: "border bg-background focus-visible:ring-ring",
  outline: "border bg-background hover:bg-muted focus-visible:ring-ring",
};

const sizeClasses: Record<SelectorSize, string> = {
  default: "h-9 px-2 py-1.5 text-sm",
  sm: "h-7 px-2 text-xs",
};

export const Selector = React.forwardRef<HTMLSelectElement, SelectorProps>(
  (
    {
      className,
      options,
      onValueChange,
      variant = "default",
      size = "default",
      disabled,
      value,
      ...props
    },
    ref
  ) => {
    function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
      onValueChange?.(e.target.value);
    }
    return (
      <select
        ref={ref}
        value={value}
        disabled={disabled}
        onChange={handleChange}
        className={cn(
          "rounded-md outline-none focus-visible:ring-2 transition-colors disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
);
Selector.displayName = "Selector";

export default Selector;
