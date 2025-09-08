import { cn } from "@/lib/utils";
import * as React from "react";

export type TagVariant = "active" | "inactive" | "archived" | "default";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
}

const variantClasses: Record<TagVariant, string> = {
  active:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  inactive:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  archived: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  default: "bg-muted/30 text-muted-foreground",
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

export default Tag;
