import { useEffect, useState } from "react";

export interface TagOption { name: string }

interface UseTagOptionsParams {
  available: TagOption[];
  initialNames: string[];
  fetchPath: string; // e.g. "/api/items/tags"
}

/**
 * Reusable hook to unify tag option bootstrapping & lazy loading.
 * - Starts with provided available list if present
 * - Falls back to unique initialNames
 * - Lazily fetches from fetchPath once if empty
 */
export function useTagOptions({ available, initialNames, fetchPath }: UseTagOptionsParams) {
  const [tagOptions, setTagOptions] = useState<TagOption[]>(
    available.length ? available : Array.from(new Set(initialNames)).map(n => ({ name: n }))
  );

  useEffect(() => {
    if (tagOptions.length === 0) {
      let cancelled = false;
      fetch(fetchPath)
        .then(r => (r.ok ? r.json() : Promise.reject()))
        .then((data: { name: string }[]) => {
          if (cancelled) return;
            setTagOptions(prev => (prev.length ? prev : data.map(t => ({ name: t.name }))));
        })
        .catch(() => {/* silent */});
      return () => { cancelled = true };
    }
  }, [fetchPath, tagOptions.length]);

  return tagOptions;
}
