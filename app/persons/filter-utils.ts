import type { PersonsListFilters } from './service';
import { PERSON_STATUS_VALUES, PERSON_TYPE_VALUES } from './schema';

// Persons filter tokens
export interface PersonFilterToken { key: string; value: string }

export function parseSearchParamsToTokens(sp: URLSearchParams): PersonFilterToken[] {
  const tokens: PersonFilterToken[] = [];
  const push = (key: string, value: string | null) => { if (value && value.trim()) tokens.push({ key, value: value.trim() }); };
  const ids = sp.get('ids'); if (ids) ids.split(',').forEach(v => push('id', v));
  const q = sp.get('q'); push('name', q);
  const tags = sp.get('tags'); if (tags) tags.split(',').forEach(v => push('tag', v));
  const status = sp.get('status'); if (status) push('status', status);
  const type = sp.get('type'); if (type) push('type', type);
  // Support generic filter param (space separated key:value tokens)
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
  // Default status active if none provided (mirrors items behavior)
  const hasStatus = tokens.some(t => t.key === 'status');
  if (!hasStatus) tokens.push({ key: 'status', value: 'active' });
  return tokens;
}

export function tokensToSearchParams(tokens: PersonFilterToken[]): URLSearchParams {
  const sp = new URLSearchParams();
  const ids = tokens.filter(t => t.key === 'id').map(t => t.value);
  if (ids.length) sp.set('ids', Array.from(new Set(ids)).join(','));
  const names = tokens.filter(t => t.key === 'name').map(t => t.value).filter(Boolean);
  if (names.length) sp.set('q', names.join(' '));
  const tagVals = tokens.filter(t => t.key === 'tag').map(t => t.value);
  if (tagVals.length) sp.set('tags', Array.from(new Set(tagVals)).join(','));
  const statusTok = tokens.find(t => t.key === 'status');
  if (statusTok && statusTok.value !== 'active') sp.set('status', statusTok.value);
  const typeTok = tokens.find(t => t.key === 'type');
  if (typeTok) sp.set('type', typeTok.value);
  return sp;
}

export function tokensToFilters(tokens: PersonFilterToken[]): PersonsListFilters {
  const filters: PersonsListFilters = {};
  const ids = tokens.filter(t => t.key === 'id').map(t => Number(t.value)).filter(v => Number.isInteger(v) && v > 0);
  if (ids.length) filters.ids = Array.from(new Set(ids));
  const nameParts = tokens.filter(t => t.key === 'name').map(t => t.value.trim()).filter(Boolean);
  if (nameParts.length) filters.nameQuery = nameParts.join(' ');
  const tagIds = tokens.filter(t => t.key === 'tag').map(t => Number(t.value)).filter(v => Number.isInteger(v) && v > 0);
  if (tagIds.length) filters.tagIds = Array.from(new Set(tagIds));
  const statusTok = tokens.find(t => t.key === 'status'); if (statusTok) filters.status = statusTok.value as any;
  const typeTok = tokens.find(t => t.key === 'type'); if (typeTok) filters.type = typeTok.value;
  return filters;
}

export function parseSearchParamsToFilters(sp: URLSearchParams): PersonsListFilters {
  return tokensToFilters(parseSearchParamsToTokens(sp));
}

export function normalizeInputToToken(raw: string): PersonFilterToken | null {
  const trimmed = raw.trim(); if (!trimmed) return null;
  if (trimmed.includes(':')) { const idx = trimmed.indexOf(':'); const k = trimmed.slice(0, idx); const v = trimmed.slice(idx + 1); if (k && v) return { key: k, value: v }; return null; }
  if (/^\d+$/.test(trimmed)) return { key: 'id', value: trimmed };
  return { key: 'name', value: trimmed };
}
