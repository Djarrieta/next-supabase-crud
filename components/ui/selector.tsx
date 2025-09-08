"use client";
import { cn } from "@/lib/utils";
import { ChangeEvent, forwardRef, SelectHTMLAttributes } from "react";

type SelectorVariant = "default" | "outline";
type SelectorSize = "default" | "sm";

export interface SelectorOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectorProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "size"> {
  options: SelectorOption[];
  /** Current value */
  value?: string | number;
  /** Change handler that receives the primitive value */
  onValueChange?: (value: string) => void;
  variant?: SelectorVariant;
  size?: SelectorSize; // custom visual size, not the native numeric "size" attribute
  /** Optional label rendered above the selector */
  label?: string;
  /** Class applied to wrapping container when label provided */
  wrapperClassName?: string;
  /** Class applied to the label element */
  labelClassName?: string;
}

const variantClasses: Record<SelectorVariant, string> = {
  default: "border bg-background focus-visible:ring-ring",
  outline: "border bg-background hover:bg-muted focus-visible:ring-ring",
};

const sizeClasses: Record<SelectorSize, string> = {
  default: "h-9 px-2 py-1.5 text-sm",
  sm: "h-7 px-2 text-xs",
};

export const Selector = forwardRef<HTMLSelectElement, SelectorProps>(
  (
    {
      className,
      options,
      onValueChange,
      variant = "default",
      size = "default",
      disabled,
      value,
      label,
      wrapperClassName,
      labelClassName,
      ...props
    },
    ref
  ) => {
    function handleChange(e: ChangeEvent<HTMLSelectElement>) {
      onValueChange?.(e.target.value);
    }
    const selectEl = (
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

    if (!label) return selectEl;

    const id = props.id; // if consumer passes id we use it for htmlFor
    return (
      <div className={cn("space-y-2", wrapperClassName)}>
        <label
          htmlFor={id}
          className={cn(
            "text-xs font-medium uppercase tracking-wide text-muted-foreground",
            labelClassName
          )}
        >
          {label}
        </label>
        {selectEl}
      </div>
    );
  }
);
Selector.displayName = "Selector";

export default Selector;
