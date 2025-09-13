import React from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import clsx from "clsx";

/**
 * Generic column definition for TableTemplatePage
 * cell: renderer for the column (row) => ReactNode
 */
export interface TableTemplateColumn<T> {
  id: string; // unique id / key for the column
  header: React.ReactNode;
  className?: string;
  cell: (row: T) => React.ReactNode;
  /** If true, this column header + cells are visually right aligned */
  alignRight?: boolean;
  /** Optional fixed / preferred width (tailwind class) */
  widthClass?: string;
}

export interface TableTemplateProps<T> {
  title: string;
  description?: string;
  /** Data rows */
  rows: T[];
  /** Total rows (for pagination). If provided together with page & pageSize footer pagination will display */
  totalRows?: number;
  page?: number;
  pageSize?: number;
  /** Function that builds a href for a given target page (server-side). */
  makePageHref?: (page: number) => string;
  /** Column descriptors */
  columns: TableTemplateColumn<T>[];
  /** Message to show when no rows */
  emptyMessage?: string;
  /** Optional element(s) rendered to the right of the header (Add button, filters, etc.) */
  controlsStart?: React.ReactNode; // left side (e.g. Add button)
  controlsEnd?: React.ReactNode; // right side (e.g. filters)
  /** Extra content under the table */
  footer?: React.ReactNode;
  /** Optional breadcrumb (rendered above the title). Accepts any React node (e.g. a list of links). */
  breadcrumb?: React.ReactNode;
  /** Additional class names for root */
  className?: string;
}

/**
 * Reusable resource table page layout.
 * Provides a consistent heading, control bar, and table structure across entities.
 */
export function TableTemplate<T extends { id: string | number }>(
  props: TableTemplateProps<T>
) {
  const {
    title,
    description,
    rows,
    totalRows,
    page = 1,
    pageSize = rows.length || 10,
    makePageHref,
    columns,
    emptyMessage = "No records found",
    controlsStart,
    controlsEnd,
    footer,
    breadcrumb,
    className,
  } = props;

  const totalPages =
    totalRows !== undefined ? Math.max(1, Math.ceil(totalRows / pageSize)) : 1;

  function renderPagination() {
    if (totalRows === undefined || !makePageHref) return null;
    const hasPrev = page > 1;
    const hasNext = page < totalPages;
    const baseCls = "px-3 py-1 rounded border text-sm";
    return (
      <div className="flex flex-wrap items-center gap-3 justify-end w-full py-2">
        {hasPrev ? (
          <Link
            prefetch={false}
            href={makePageHref(page - 1)}
            className={baseCls}
            aria-label="Previous page"
          >
            Prev
          </Link>
        ) : (
          <span className={clsx(baseCls, "opacity-40 cursor-not-allowed")}>
            Prev
          </span>
        )}
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>

        {hasNext ? (
          <Link
            prefetch={false}
            href={makePageHref(page + 1)}
            className={baseCls}
            aria-label="Next page"
          >
            Next
          </Link>
        ) : (
          <span className={clsx(baseCls, "opacity-40 cursor-not-allowed")}>
            Next
          </span>
        )}

        <form
          action={makePageHref(1)}
          className="flex items-center gap-1 text-sm"
          aria-label="Jump to page form"
        >
          <label className="sr-only" htmlFor={`jump-page-input-${title}`}>
            Jump to page
          </label>
          <input
            id={`jump-page-input-${title}`}
            type="number"
            name="page"
            min={1}
            max={totalPages}
            defaultValue={page}
            className="w-16 px-2 py-1 border rounded bg-background"
            aria-describedby={`jump-page-total-${title}`}
          />
          <button type="submit" className={baseCls} aria-label="Go to page">
            Go
          </button>
          <span id={`jump-page-total-${title}`} className="sr-only">
            of {totalPages} pages
          </span>
        </form>
      </div>
    );
  }

  return (
    <div className={clsx("space-y-6", className)}>
      {breadcrumb && (
        <div className="text-sm text-muted-foreground">{breadcrumb}</div>
      )}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {(controlsStart || controlsEnd) && (
        <div className="flex flex-wrap items-center gap-4">
          {controlsStart}
          <div className="ml-auto flex items-center gap-4">{controlsEnd}</div>
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.id}
                  className={clsx(col.widthClass, col.className, {
                    "text-right": col.alignRight,
                  })}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={(row as any).id}>
                {columns.map((col) => (
                  <TableCell
                    key={col.id}
                    className={clsx({ "text-right": col.alignRight })}
                  >
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {(footer || totalRows !== undefined) && (
        <div className="flex flex-col gap-2">
          {footer}
          {renderPagination()}
        </div>
      )}
    </div>
  );
}

export default TableTemplate;
