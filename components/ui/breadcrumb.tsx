import React from "react";
import Link from "next/link";
import clsx from "clsx";

export interface BreadcrumbItem {
  label: string;
  href?: string; // if absent, treated as current page (no link)
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  separator?: React.ReactNode; // default '/'
}

// Simple reusable breadcrumb component. Usage:
// <Breadcrumb items={[{ label: 'Items', href: '/items' }, { label: 'Tags' }]} />
export function Breadcrumb({
  items,
  className,
  separator = <span>/</span>,
}: BreadcrumbProps) {
  if (!items?.length) return null;
  return (
    <nav aria-label="Breadcrumb">
      <ol className={clsx("flex items-center gap-2 text-sm", className)}>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:underline  dark:text-blue-400"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={clsx(isLast && "font-medium")}>
                  {item.label}
                </span>
              )}
              {!isLast && separator}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
