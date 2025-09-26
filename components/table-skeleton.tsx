import React from "react";

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  withHeader?: boolean;
  className?: string;
}

export function TableSkeleton({
  rows = 8,
  cols = 3,
  withHeader = true,
  className,
}: TableSkeletonProps) {
  const headerCells = Array.from({ length: cols });
  const bodyRows = Array.from({ length: rows });
  return (
    <div className={className} aria-busy="true" aria-live="polite">
      <div className="animate-pulse rounded-md border overflow-hidden">
        <table className="w-full border-collapse">
          {withHeader && (
            <thead className="bg-muted/40">
              <tr>
                {headerCells.map((_, i) => (
                  <th key={i} className="p-3 text-left">
                    <div className="h-3 w-20 bg-muted rounded" />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {bodyRows.map((_, r) => (
              <tr key={r} className="border-t">
                {headerCells.map((__, c) => (
                  <td key={c} className="p-3 align-middle">
                    <div className="h-3 bg-muted rounded w-full max-w-[140px]" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TableSkeleton;
