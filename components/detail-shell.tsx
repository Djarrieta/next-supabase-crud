"use client";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { PencilIcon, ViewIcon } from "@/components/icons";

interface DetailShellProps {
  editMode: boolean;
  onToggle(): void;
  isPending: boolean;
  savedAt: number | null;
  error: string | null;
  onArchive?: () => void;
  archiveVisible?: boolean; // override visibility (default: editMode && onArchive)
  children: ReactNode | ((ctx: { editMode: boolean }) => ReactNode);
  className?: string;
  formId?: string; // optional id of form element to target Save submit
  showSaveWhenEdit?: boolean; // default true
}

export function DetailShell({
  editMode,
  onToggle,
  isPending,
  savedAt,
  error,
  onArchive,
  archiveVisible,
  children,
  className,
  formId,
  showSaveWhenEdit = true,
}: DetailShellProps) {
  const showArchive =
    typeof onArchive === "function" && (archiveVisible ?? editMode);
  const body =
    typeof children === "function" ? children({ editMode }) : children;
  return (
    <div className={"relative " + (className ?? "")}>
      <div className="absolute top-0 right-0 flex items-center gap-2">
        <Button
          type="button"
          variant={editMode ? "primary" : "outline"}
          size="sm"
          onClick={onToggle}
          aria-pressed={editMode}
          className="flex items-center gap-1"
        >
          {editMode ? (
            <ViewIcon className="w-3.5 h-3.5" />
          ) : (
            <PencilIcon className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
      <div className="pr-20">
        {body}
        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="text-xs text-muted-foreground space-x-3">
            {isPending && <span>Saving...</span>}
            {editMode && savedAt && !isPending && (
              <span className="text-green-600">Saved</span>
            )}
            {error && <span className="text-red-600">{error}</span>}
          </div>
          <div className="flex gap-2">
            {showArchive && editMode && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={onArchive}
              >
                Archive
              </Button>
            )}
            {editMode && showSaveWhenEdit && (
              <Button
                type={formId ? "submit" : "button"}
                form={formId}
                size="sm"
                variant="primary"
                disabled={isPending}
              >
                Save
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
