import { useCallback, useState, useTransition } from "react";

interface RunSaveOptions {
  recordTimestamp?: boolean; // default true
  onError?: (error: unknown) => void;
}

interface UseDetailSaveResult {
  runSave: (fn: () => Promise<void>, options?: RunSaveOptions) => void;
  isPending: boolean;
  savedAt: number | null;
  error: string | null;
  reset: () => void;
}

/**
 * Encapsulates async save lifecycle concerns used by detail editors.
 * - Provides isPending (from React transition)
 * - Tracks last successful save time (savedAt)
 * - Captures error messages
 */
export function useDetailSave(): UseDetailSaveResult {
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runSave = useCallback(
    (fn: () => Promise<void>, options?: RunSaveOptions) => {
      const { recordTimestamp = true, onError } = options || {};
      setError(null);
      startTransition(async () => {
        try {
          await fn();
          if (recordTimestamp) setSavedAt(Date.now());
        } catch (e: any) {
          const msg = e?.message || "Save failed";
            setError(msg);
            onError?.(e);
        }
      });
    },
    []
  );

  const reset = useCallback(() => {
    setSavedAt(null);
    setError(null);
  }, []);

  return { runSave, isPending, savedAt, error, reset };
}
