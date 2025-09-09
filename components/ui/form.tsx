"use client";
import {
  Selector,
  SelectorOption,
  SelectorProps,
} from "@/components/ui/selector";
import { TagGroup, TagGroupProps } from "@/components/ui/tag";
import { cn } from "@/lib/utils";
import {
  FormHTMLAttributes,
  forwardRef,
  InputHTMLAttributes,
  useState,
} from "react";

// Root form component
type FormRootProps = FormHTMLAttributes<HTMLFormElement> & {
  action?: (formData: FormData) => void | Promise<void>;
};

const Form = forwardRef<HTMLFormElement, FormRootProps>(
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
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
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

const TextInput = forwardRef<HTMLInputElement, BaseInputProps>(
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

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
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
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  name: string;
  id?: string;
  containerClassName?: string;
  labelClassName?: string;
}

const CheckboxInput = forwardRef<HTMLInputElement, CheckboxInputProps>(
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

const SelectorInput = forwardRef<HTMLSelectElement, SelectorInputProps>(
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

// Tags (checkbox group) input wrapper
interface TagsInputProps extends Omit<TagGroupProps, "wrapperClassName"> {
  name: string;
  label?: string;
  wrapperClassName?: string; // allow override of flex container spacing
}

const TagsInput = forwardRef<HTMLDivElement, TagsInputProps>(
  ({ name, label = "Tags", wrapperClassName, ...props }, ref) => {
    return (
      <TagGroup
        ref={ref}
        name={name}
        label={label}
        wrapperClassName={wrapperClassName}
        {...props}
      />
    );
  }
);
TagsInput.displayName = "FormTagsInput";

export const FormNamespace = Object.assign(Form, {
  TextInput,
  NumberInput,
  CheckboxInput,
  Selector: SelectorInput,
  Tags: TagsInput,
  // Lightweight multi-select (checkbox list) for components selection.
  MultiSelect: ({
    name,
    label,
    options,
    initialValues = [],
    idPrefix,
  }: {
    name: string;
    label: string;
    options: { value: number; label: string }[];
    initialValues?: number[];
    idPrefix?: string;
  }) => {
    const [selected, setSelected] = useState<Set<number>>(
      new Set(initialValues)
    );
    return (
      <div className="space-y-2">
        <span className={baseLabelClasses}>{label}</span>
        <div className="max-h-40 overflow-auto rounded border p-2 space-y-1 bg-background">
          {options.map((o) => {
            const id = `${idPrefix || name}-${o.value}`;
            const checked = selected.has(o.value);
            return (
              <label
                key={o.value}
                htmlFor={id}
                className="flex items-center gap-2 text-xs"
              >
                <input
                  id={id}
                  type="checkbox"
                  className="h-3 w-3"
                  defaultChecked={checked}
                  onChange={(e) => {
                    const next = new Set(selected);
                    if (e.target.checked) next.add(o.value);
                    else next.delete(o.value);
                    setSelected(next);
                  }}
                />
                <span className="flex-1 truncate">{o.label}</span>
              </label>
            );
          })}
        </div>
        {/* Mirror selected values as hidden inputs for form submission */}
        {Array.from(selected).map((v) => (
          <input key={v} type="hidden" name={name} value={v} />
        ))}
      </div>
    );
  },
});

export { FormNamespace as Form };
