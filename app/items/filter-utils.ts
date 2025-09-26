import { ItemsListFilters } from './service';
import { createFilterUtils, FilterToken } from '@/lib/filter-utils';

// Instantiate generic utilities with item-specific tokensToFilters logic.
const base = createFilterUtils<ItemsListFilters>({
  includeUnique: true,
  tokensToFilters(tokens) {
    const { helpers } = base as any; // circular while constructing; we'll reassign after creation
    const filters: ItemsListFilters = {};
    const ids = helpers.extractCommonNumericList(tokens, 'id'); if (ids) filters.ids = ids;
    const nameQuery = helpers.extractNameQuery(tokens); if (nameQuery) filters.nameQuery = nameQuery;
    const tagIds = helpers.extractCommonNumericList(tokens, 'tag'); if (tagIds) filters.tagIds = tagIds;
    const status = helpers.extractSingle(tokens, 'status'); if (status) filters.status = status as any;
    const unique = helpers.parseUniqueBoolean(tokens); if (unique !== undefined) filters.unique = unique;
    return filters;
  }
});

// Re-export the same API shape expected by existing callers
export const parseSearchParamsToTokens = base.parseSearchParamsToTokens;
export const tokensToSearchParams = base.tokensToSearchParams;
export const tokensToFilters = base.tokensToFilters;
export const parseSearchParamsToFilters = base.parseSearchParamsToFilters;
export const normalizeInputToToken = base.normalizeInputToToken;
export type { FilterToken };
