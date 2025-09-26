import React from "react";

export function DetailSkeleton() {
  return (
    <div
      className="space-y-6 animate-pulse"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="h-5 w-48 bg-muted rounded" />
      <div className="space-y-4">
        <div className="h-7 w-72 bg-muted rounded" />
        <div className="h-4 w-full max-w-xl bg-muted/70 rounded" />
        <div className="h-4 w-full max-w-lg bg-muted/50 rounded" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
          <div className="h-24 bg-muted rounded" />
        </div>
        <div className="space-y-4">
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

export default DetailSkeleton;
