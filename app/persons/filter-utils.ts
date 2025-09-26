import type { PersonsListFilters } from './service';
import { createFilterUtils, FilterToken } from '@/lib/filter-utils';

// Generic factory configured for persons (adds type field, no unique boolean)
const base = createFilterUtils<PersonsListFilters>({
  includeType: true,
  tokensToFilters(tokens) {
    const { helpers } = base as any;
    const filters: PersonsListFilters = {};
    const ids = helpers.extractCommonNumericList(tokens, 'id'); if (ids) filters.ids = ids;
    const nameQuery = helpers.extractNameQuery(tokens); if (nameQuery) filters.nameQuery = nameQuery;
    const tagIds = helpers.extractCommonNumericList(tokens, 'tag'); if (tagIds) filters.tagIds = tagIds;
    const status = helpers.extractSingle(tokens, 'status'); if (status) filters.status = status;
    const type = helpers.extractSingle(tokens, 'type'); if (type) filters.type = type;
    return filters;
  }
});

export const parseSearchParamsToTokens = base.parseSearchParamsToTokens;
export const tokensToSearchParams = base.tokensToSearchParams;
export const tokensToFilters = base.tokensToFilters;
export const parseSearchParamsToFilters = base.parseSearchParamsToFilters;
export const normalizeInputToToken = base.normalizeInputToToken;
export type PersonFilterToken = FilterToken;
