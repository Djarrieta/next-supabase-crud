"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Selector,
  SelectorProps,
  SelectorOption,
} from "@/components/ui/selector";

// Root form component
type FormRootProps = React.FormHTMLAttributes<HTMLFormElement> & {
  action?: (formData: FormData) => void | Promise<void>;
};

const Form = React.forwardRef<HTMLFormElement, FormRootProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <form ref={ref} className={cn("space-y-4 pt-2", className)} {...props}>
        {children}
      </form>
    );
  }
);
Form.displayName = "Form";

// Shared props for text & number inputs
interface BaseInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  name: string; // enforce name
  containerClassName?: string;
  labelClassName?: string;
  /** Provide custom id; defaults to name */
  id?: string;
}

const baseLabelClasses =
  "text-xs font-medium uppercase tracking-wide text-muted-foreground";
const baseInputClasses =
  "w-full rounded-md border px-3 py-2 text-sm bg-background";

const TextInput = React.forwardRef<HTMLInputElement, BaseInputProps>(
  (
    {
      label,
      name,
      id: customId,
      className,
      containerClassName,
      labelClassName,
      ...props
    },
    ref
  ) => {
    const id = customId || name;
    return (
      <div className={cn("space-y-2", containerClassName)}>
        <label htmlFor={id} className={cn(baseLabelClasses, labelClassName)}>
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          name={name}
          className={cn(baseInputClasses, className)}
          {...props}
        />
      </div>
    );
  }
);
TextInput.displayName = "FormTextInput";

interface NumberInputProps extends BaseInputProps {}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      label,
      name,
      id: customId,
      className,
      containerClassName,
      labelClassName,
      ...props
    },
    ref
  ) => {
    const id = customId || name;
    return (
      <div className={cn("space-y-2", containerClassName)}>
        <label htmlFor={id} className={cn(baseLabelClasses, labelClassName)}>
          {label}
        </label>
        <input
          ref={ref}
          type="number"
          id={id}
          name={name}
          className={cn(baseInputClasses, className)}
          {...props}
        />
      </div>
    );
  }
);
NumberInput.displayName = "FormNumberInput";

interface CheckboxInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  name: string;
  id?: string;
  containerClassName?: string;
  labelClassName?: string;
}

const CheckboxInput = React.forwardRef<HTMLInputElement, CheckboxInputProps>(
  (
    {
      label,
      name,
      id: customId,
      className,
      containerClassName,
      labelClassName,
      ...props
    },
    ref
  ) => {
    const id = customId || name;
    return (
      <div className={cn("flex items-center gap-2", containerClassName)}>
        <input
          ref={ref}
          type="checkbox"
          id={id}
          name={name}
          className={cn("h-4 w-4 rounded border", className)}
          {...props}
        />
        <label htmlFor={id} className={cn(baseLabelClasses, labelClassName)}>
          {label}
        </label>
      </div>
    );
  }
);
CheckboxInput.displayName = "FormCheckboxInput";

// (Optional) placeholder for future select etc.

interface SelectorInputProps extends Omit<SelectorProps, "label" | "options"> {
  label: string;
  name: string;
  id?: string;
  options: SelectorOption[];
}

const SelectorInput = React.forwardRef<HTMLSelectElement, SelectorInputProps>(
  ({ label, name, id: customId, options, className, ...props }, ref) => {
    const id = customId || name;
    return (
      <Selector
        ref={ref}
        id={id}
        name={name}
        label={label}
        options={options}
        wrapperClassName="space-y-2"
        labelClassName={baseLabelClasses}
        className={cn(baseInputClasses, className)}
        {...props}
      />
    );
  }
);
SelectorInput.displayName = "FormSelectorInput";

export const FormNamespace = Object.assign(Form, {
  TextInput,
  NumberInput,
  CheckboxInput,
  Selector: SelectorInput,
});

export { FormNamespace as Form };
