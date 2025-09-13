"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
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

  // Sync tokens when URL changes externally
  useEffect(() => {
    setTokens(parseSearchParamsToTokens(new URLSearchParams(searchParams.toString())));
  }, [searchParams]);

  const addRaw = useCallback((raw: string) => {
    const t = normalizeInputToToken(raw);
    if (t) setTokens(prev => [...prev, t]);
  }, []);

  const removeAt = useCallback((index: number) => {
    setTokens(prev => prev.filter((_, i) => i !== index));
  }, []);

  const apply = useCallback(() => {
    const sp = tokensToSearchParams(tokens);
    // Clear existing filter-related params for a clean slate
    const existing = new URLSearchParams(searchParams.toString());
    ['ids','q','tags','unique','status'].forEach(k => existing.delete(k));
    sp.forEach((v, k) => existing.set(k, v));
    if (existing.get('page')) existing.delete('page');
    router.replace('?' + existing.toString());
  }, [tokens, searchParams, router]);

  const reset = useCallback(() => {
    setTokens([]);
    const existing = new URLSearchParams(searchParams.toString());
    ['ids','q','tags','unique','status'].forEach(k => existing.delete(k));
    if (existing.get('page')) existing.delete('page');
    router.replace('?' + existing.toString());
  }, [searchParams, router]);

  return { tokens, setTokens, addRaw, removeAt, apply, reset };
}

export default useItemsFilters;
