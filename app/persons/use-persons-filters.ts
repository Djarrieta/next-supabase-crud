"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState, useRef } from 'react';
import { PersonFilterToken, parseSearchParamsToTokens, tokensToSearchParams, tokensToFilters, normalizeInputToToken } from './filter-utils';

export interface UsePersonsFiltersResult {
  tokens: PersonFilterToken[];
  setTokens: (t: PersonFilterToken[]) => void;
  addRaw: (raw: string) => void;
  removeAt: (index: number) => void;
  apply: () => void;
  reset: () => void;
  filters: ReturnType<typeof tokensToFilters>;
}

export function usePersonsFilters(): UsePersonsFiltersResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tokens, setTokens] = useState<PersonFilterToken[]>(() => parseSearchParamsToTokens(new URLSearchParams(searchParams.toString())));
  const lastAppliedRef = useRef<PersonFilterToken[]>(tokens);

  const areTokensEqual = (a: PersonFilterToken[], b: PersonFilterToken[]) => {
    if (a.length !== b.length) return false;
    const norm = (arr: PersonFilterToken[]) => arr.slice().sort((x, y) => (x.key + x.value).localeCompare(y.key + y.value)).map(t => `${t.key}:${t.value}`).join('|');
    return norm(a) === norm(b);
  };

  // Sync when URL changes externally
  useEffect(() => {
    const next = parseSearchParamsToTokens(new URLSearchParams(searchParams.toString()));
    setTokens(prev => areTokensEqual(prev, next) ? prev : next);
  }, [searchParams]);

  const addRaw = useCallback((raw: string) => {
    const t = normalizeInputToToken(raw);
    if (t) setTokens(prev => [...prev, t]);
  }, []);

  const removeAt = useCallback((index: number) => {
    setTokens(prev => prev.filter((_, i) => i !== index));
  }, []);

  const apply = useCallback(() => {
    if (areTokensEqual(tokens, lastAppliedRef.current)) return;
    const sp = tokensToSearchParams(tokens);
    const existing = new URLSearchParams(searchParams.toString());
    ['ids', 'q', 'tags', 'status', 'type'].forEach(k => existing.delete(k));
    sp.forEach((v, k) => existing.set(k, v));
    if (existing.get('page')) existing.delete('page');
    lastAppliedRef.current = tokens;
    router.replace('?' + existing.toString());
  }, [tokens, searchParams, router]);

  const reset = useCallback(() => {
    setTokens([]);
    const existing = new URLSearchParams(searchParams.toString());
    ['ids', 'q', 'tags', 'status', 'type'].forEach(k => existing.delete(k));
    if (existing.get('page')) existing.delete('page');
    lastAppliedRef.current = [];
    router.replace('?' + existing.toString());
  }, [searchParams, router]);

  const filters = tokensToFilters(tokens);
  return { tokens, setTokens, addRaw, removeAt, apply, reset, filters };
}

export default usePersonsFilters;
