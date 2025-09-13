"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState, useRef } from 'react';
import { FilterToken, parseSearchParamsToTokens, tokensToSearchParams, normalizeInputToToken } from '@/app/items/filter-utils';

export interface UseItemsFiltersResult {
  tokens: FilterToken[];
  setTokens: (t: FilterToken[]) => void;
  addRaw: (raw: string) => void;
  removeAt: (index: number) => void;
  apply: () => void;
  reset: () => void;
}

export function useItemsFilters(): UseItemsFiltersResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tokens, setTokens] = useState<FilterToken[]>(() => parseSearchParamsToTokens(new URLSearchParams(searchParams.toString())));
  // Keep a ref of last applied tokens to detect no-op updates (avoid resetting page when unchanged)
  const lastAppliedRef = useRef<FilterToken[]>(tokens);

  const areTokensEqual = (a: FilterToken[], b: FilterToken[]) => {
    if (a.length !== b.length) return false;
    const norm = (arr: FilterToken[]) => arr
      .slice()
      .sort((x, y) => (x.key + x.value).localeCompare(y.key + y.value))
      .map(t => `${t.key}:${t.value}`)
      .join('|');
    return norm(a) === norm(b);
  };

  // Sync tokens when URL changes externally
  useEffect(() => {
    const next = parseSearchParamsToTokens(new URLSearchParams(searchParams.toString()));
    setTokens(prev => {
      // If URL-driven tokens differ from current state but match last applied, we still update state.
      return areTokensEqual(prev, next) ? prev : next;
    });
  }, [searchParams]);

  const addRaw = useCallback((raw: string) => {
    const t = normalizeInputToToken(raw);
    if (t) setTokens(prev => [...prev, t]);
  }, []);

  const removeAt = useCallback((index: number) => {
    setTokens(prev => prev.filter((_, i) => i !== index));
  }, []);

  const apply = useCallback(() => {
    // If tokens did not change since last apply, do nothing (prevents page reset)
    if (areTokensEqual(tokens, lastAppliedRef.current)) return;
    const sp = tokensToSearchParams(tokens);
    const existing = new URLSearchParams(searchParams.toString());
    // Only wipe filter-related params; preserve page if filters unchanged (already handled above)
    ['ids','q','tags','unique','status'].forEach(k => existing.delete(k));
    sp.forEach((v, k) => existing.set(k, v));
    // Reset page to 1 only when filters actually changed
    if (existing.get('page')) existing.delete('page');
    lastAppliedRef.current = tokens;
    router.replace('?' + existing.toString());
  }, [tokens, searchParams, router]);

  const reset = useCallback(() => {
    setTokens([]);
    const existing = new URLSearchParams(searchParams.toString());
    ['ids','q','tags','unique','status'].forEach(k => existing.delete(k));
    if (existing.get('page')) existing.delete('page');
    lastAppliedRef.current = [];
    router.replace('?' + existing.toString());
  }, [searchParams, router]);

  return { tokens, setTokens, addRaw, removeAt, apply, reset };
}

export default useItemsFilters;
