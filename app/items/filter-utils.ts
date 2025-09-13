import { ItemsListFilters } from './service';

export interface FilterToken { key: string; value: string }

export function parseSearchParamsToTokens(sp: URLSearchParams): FilterToken[] {
  const tokens: FilterToken[] = [];
  const push = (key: string, value: string | null) => { if (value && value.trim()) tokens.push({ key, value: value.trim() }); };
  const ids = sp.get('ids');
  if (ids) ids.split(',').forEach(v => push('id', v));
  const q = sp.get('q'); push('name', q);
  const tags = sp.get('tags'); if (tags) tags.split(',').forEach(v => push('tag', v));
  const unique = sp.get('unique'); if (unique) push('unique', unique);
  const status = sp.get('status'); if (status) push('status', status);
  const filter = sp.get('filter');
  if (filter) {
    filter.split(/\s+/).filter(Boolean).forEach(tok => {
      const idx = tok.indexOf(':');
      if (idx > 0) {
        const k = tok.slice(0, idx);
        const v = tok.slice(idx + 1);
        if (k && v) tokens.push({ key: k, value: v });
      }
    });
  }
  // Inject default status:active if user did not specify any status-like token
  const hasStatus = tokens.some(t => t.key === 'status');
  if (!hasStatus) {
    tokens.push({ key: 'status', value: 'active' });
  }
  return tokens;
}

export function tokensToSearchParams(tokens: FilterToken[]): URLSearchParams {
  const sp = new URLSearchParams();
  const ids = tokens.filter(t => t.key === 'id').map(t => t.value);
  if (ids.length) sp.set('ids', Array.from(new Set(ids)).join(','));
  const names = tokens.filter(t => t.key === 'name').map(t => t.value).filter(Boolean);
  if (names.length) sp.set('q', names.join(' '));
  const tags = tokens.filter(t => t.key === 'tag').map(t => t.value);
  if (tags.length) sp.set('tags', Array.from(new Set(tags)).join(','));
  const status = tokens.find(t => t.key === 'status');
  // Omit status=active from query params to keep URL clean (active is default)
  if (status && status.value !== 'active') sp.set('status', status.value);
  const unique = tokens.find(t => t.key === 'unique');
  if (unique) sp.set('unique', unique.value);
  return sp;
}

export function tokensToFilters(tokens: FilterToken[]): ItemsListFilters {
  const filters: ItemsListFilters = {};
  const ids = tokens.filter(t => t.key === 'id').map(t => Number(t.value)).filter(v => Number.isInteger(v) && v > 0);
  if (ids.length) filters.ids = Array.from(new Set(ids));
  const nameParts = tokens.filter(t => t.key === 'name').map(t => t.value.trim()).filter(Boolean);
  if (nameParts.length) filters.nameQuery = nameParts.join(' ');
  const tagIds = tokens.filter(t => t.key === 'tag').map(t => Number(t.value)).filter(v => Number.isInteger(v) && v > 0);
  if (tagIds.length) filters.tagIds = Array.from(new Set(tagIds));
  const statusTok = tokens.find(t => t.key === 'status');
  if (statusTok) filters.status = statusTok.value as any; // validation in service layer
  const uniqueTok = tokens.find(t => t.key === 'unique');
  if (uniqueTok) {
    const v = uniqueTok.value.toLowerCase();
    if (['true','1','yes','y'].includes(v)) filters.unique = true; else if (['false','0','no','n'].includes(v)) filters.unique = false;
  }
  return filters;
}

export function parseSearchParamsToFilters(sp: URLSearchParams): ItemsListFilters {
  return tokensToFilters(parseSearchParamsToTokens(sp));
}

export function normalizeInputToToken(raw: string): FilterToken | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.includes(':')) {
    const idx = trimmed.indexOf(':');
    const k = trimmed.slice(0, idx);
    const v = trimmed.slice(idx + 1);
    if (k && v) return { key: k, value: v };
    return null;
  }
  if (/^\d+$/.test(trimmed)) return { key: 'id', value: trimmed };
  return { key: 'name', value: trimmed };
}
