import React from "react";
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
  /** Column descriptors */
  columns: TableTemplateColumn<T>[];
  /** Message to show when no rows */
  emptyMessage?: string;
  /** Optional element(s) rendered to the right of the header (Add button, filters, etc.) */
  controlsStart?: React.ReactNode; // left side (e.g. Add button)
  controlsEnd?: React.ReactNode; // right side (e.g. filters)
  /** Extra content under the table */
  footer?: React.ReactNode;
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
    columns,
    emptyMessage = "No records found",
    controlsStart,
    controlsEnd,
    footer,
    className,
  } = props;

  return (
    <div className={clsx("space-y-6", className)}>
      <div>
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
      {footer && <div>{footer}</div>}
    </div>
  );
}

export default TableTemplate;
