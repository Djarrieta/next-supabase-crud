// Generic filter utilities to avoid duplication across feature modules (items, persons, etc.).
// Provides a factory that returns a cohesive set of functions to map between:
//   URLSearchParams <-> FilterToken[] <-> Domain Filters Object
// The default implementation handles common tokens: id, name, tag, status, and optional unique/type.
// Feature modules can extend behavior by supplying a custom tokensToFilters implementation.

export interface FilterToken { key: string; value: string }

export interface CreateFilterUtilsConfig<TFilters> {
  // Inject status default if absent (defaults to 'active' when true)
  defaultStatusValue?: string; // default 'active'
  includeUnique?: boolean;     // items
  includeType?: boolean;       // persons (natural|legal)
  // Convert tokens -> feature specific filters object
  tokensToFilters(tokens: FilterToken[]): TFilters;
  // Optional hook to post-process the token list before returning from parse
  finalizeTokens?(tokens: FilterToken[]): void;
}

// Helper predicates
const truthyValues = ['true','1','yes','y'];
const falsyValues = ['false','0','no','n'];

export function createFilterUtils<TFilters>(config: CreateFilterUtilsConfig<TFilters>) {
  const defaultStatus = config.defaultStatusValue ?? 'active';

  function parseSearchParamsToTokens(sp: URLSearchParams): FilterToken[] {
    const tokens: FilterToken[] = [];
    const push = (key: string, value: string | null) => {
      if (value && value.trim()) tokens.push({ key, value: value.trim() });
    };
    const ids = sp.get('ids'); if (ids) ids.split(',').forEach(v => push('id', v));
    const q = sp.get('q'); push('name', q);
    const tags = sp.get('tags'); if (tags) tags.split(',').forEach(v => push('tag', v));
    const status = sp.get('status'); if (status) push('status', status);
    if (config.includeUnique) { const unique = sp.get('unique'); if (unique) push('unique', unique); }
    if (config.includeType) { const type = sp.get('type'); if (type) push('type', type); }
    // Generic free-form key:value tokens (space separated) via ?filter=... param
    const filter = sp.get('filter');
    if (filter) {
      filter.split(/\s+/).filter(Boolean).forEach(tok => {
        const idx = tok.indexOf(':');
        if (idx > 0) {
          const k = tok.slice(0, idx); const v = tok.slice(idx + 1);
          if (k && v) tokens.push({ key: k, value: v });
        }
      });
    }
    // Inject default status token if absent
    if (!tokens.some(t => t.key === 'status') && defaultStatus) {
      tokens.push({ key: 'status', value: defaultStatus });
    }
    if (config.finalizeTokens) config.finalizeTokens(tokens);
    return tokens;
  }

  function tokensToSearchParams(tokens: FilterToken[]): URLSearchParams {
    const sp = new URLSearchParams();
    // ids
    const ids = tokens.filter(t => t.key === 'id').map(t => t.value);
    if (ids.length) sp.set('ids', Array.from(new Set(ids)).join(','));
    // name (combine multi)
    const names = tokens.filter(t => t.key === 'name').map(t => t.value).filter(Boolean);
    if (names.length) sp.set('q', names.join(' '));
    // tags
    const tagVals = tokens.filter(t => t.key === 'tag').map(t => t.value);
    if (tagVals.length) sp.set('tags', Array.from(new Set(tagVals)).join(','));
    // status (omit if default)
    const statusTok = tokens.find(t => t.key === 'status');
    if (statusTok && statusTok.value !== defaultStatus) sp.set('status', statusTok.value);
    if (config.includeUnique) {
      const uniqueTok = tokens.find(t => t.key === 'unique');
      if (uniqueTok) sp.set('unique', uniqueTok.value);
    }
    if (config.includeType) {
      const typeTok = tokens.find(t => t.key === 'type');
      if (typeTok) sp.set('type', typeTok.value);
    }
    return sp;
  }

  function tokensToFilters(tokens: FilterToken[]): TFilters {
    return config.tokensToFilters(tokens);
  }

  function parseSearchParamsToFilters(sp: URLSearchParams): TFilters {
    return tokensToFilters(parseSearchParamsToTokens(sp));
  }

  function normalizeInputToToken(raw: string): FilterToken | null {
    const trimmed = raw.trim(); if (!trimmed) return null;
    if (trimmed.includes(':')) {
      const idx = trimmed.indexOf(':');
      const k = trimmed.slice(0, idx); const v = trimmed.slice(idx + 1);
      if (k && v) return { key: k, value: v };
      return null;
    }
    if (/^\d+$/.test(trimmed)) return { key: 'id', value: trimmed };
    return { key: 'name', value: trimmed };
  }

  // Helper exports for feature specific tokensToFilters implementations
  function extractCommonNumericList(tokens: FilterToken[], key: string): number[] | undefined {
    const arr = tokens.filter(t => t.key === key).map(t => Number(t.value)).filter(v => Number.isInteger(v) && v > 0);
    if (arr.length) return Array.from(new Set(arr));
    return undefined;
  }
  function extractNameQuery(tokens: FilterToken[]): string | undefined {
    const parts = tokens.filter(t => t.key === 'name').map(t => t.value.trim()).filter(Boolean);
    if (parts.length) return parts.join(' ');
    return undefined;
  }
  function extractSingle(tokens: FilterToken[], key: string): string | undefined {
    const tok = tokens.find(t => t.key === key); return tok?.value;
  }
  function parseUniqueBoolean(tokens: FilterToken[]): boolean | undefined {
    const tok = tokens.find(t => t.key === 'unique'); if (!tok) return undefined;
    const v = tok.value.toLowerCase();
    if (truthyValues.includes(v)) return true; if (falsyValues.includes(v)) return false; return undefined;
  }

  return {
    parseSearchParamsToTokens,
    tokensToSearchParams,
    tokensToFilters,
    parseSearchParamsToFilters,
    normalizeInputToToken,
    // helpers for custom tokensToFilters usage
    helpers: {
      extractCommonNumericList,
      extractNameQuery,
      extractSingle,
      parseUniqueBoolean,
    }
  };
}
