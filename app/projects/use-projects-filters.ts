"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState, useRef } from 'react';
import { ProjectFilterToken, parseSearchParamsToTokens, tokensToSearchParams, tokensToFilters, normalizeInputToToken } from './filter-utils';

export interface UseProjectsFiltersResult { tokens: ProjectFilterToken[]; setTokens: (t: ProjectFilterToken[]) => void; addRaw: (raw: string) => void; removeAt: (i: number) => void; apply: () => void; reset: () => void; filters: ReturnType<typeof tokensToFilters>; }

export function useProjectsFilters(): UseProjectsFiltersResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tokens, setTokens] = useState<ProjectFilterToken[]>(() => parseSearchParamsToTokens(new URLSearchParams(searchParams.toString())));
  const lastAppliedRef = useRef<ProjectFilterToken[]>(tokens);
  const areTokensEqual = (a: ProjectFilterToken[], b: ProjectFilterToken[]) => {
    if (a.length !== b.length) return false;
    const norm = (arr: ProjectFilterToken[]) => arr.slice().sort((x,y)=> (x.key+x.value).localeCompare(y.key+y.value)).map(t=>`${t.key}:${t.value}`).join('|');
    return norm(a) === norm(b);
  };
  useEffect(() => { const next = parseSearchParamsToTokens(new URLSearchParams(searchParams.toString())); setTokens(prev => areTokensEqual(prev,next)? prev: next); }, [searchParams]);
  const addRaw = useCallback((raw: string) => { const t = normalizeInputToToken(raw); if (t) setTokens(p => [...p, t]); }, []);
  const removeAt = useCallback((i: number) => setTokens(p => p.filter((_, idx) => idx !== i)), []);
  const apply = useCallback(() => { if (areTokensEqual(tokens, lastAppliedRef.current)) return; const sp = tokensToSearchParams(tokens); const existing = new URLSearchParams(searchParams.toString()); ['ids','q','status'].forEach(k=> existing.delete(k)); sp.forEach((v,k)=> existing.set(k,v)); if (existing.get('page')) existing.delete('page'); lastAppliedRef.current = tokens; router.replace('?' + existing.toString()); }, [tokens, searchParams, router]);
  const reset = useCallback(() => { setTokens([]); const existing = new URLSearchParams(searchParams.toString()); ['ids','q','status'].forEach(k=> existing.delete(k)); if (existing.get('page')) existing.delete('page'); lastAppliedRef.current = []; router.replace('?' + existing.toString()); }, [searchParams, router]);
  const filters = tokensToFilters(tokens);
  return { tokens, setTokens, addRaw, removeAt, apply, reset, filters };
}
export default useProjectsFilters;
