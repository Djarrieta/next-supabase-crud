import type { ProjectsListFilters } from './service';
import { createFilterUtils, FilterToken } from '@/lib/filter-utils';

const base = createFilterUtils<ProjectsListFilters>({
  tokensToFilters(tokens) {
    const { helpers } = base as any;
    const filters: ProjectsListFilters = {};
    const ids = helpers.extractCommonNumericList(tokens, 'id'); if (ids) filters.ids = ids;
    const nameQuery = helpers.extractNameQuery(tokens); if (nameQuery) filters.nameQuery = nameQuery;
    const personIds = helpers.extractCommonNumericList(tokens, 'person'); if (personIds) filters.personIds = personIds;
    const status = helpers.extractSingle(tokens, 'status'); if (status) filters.status = status;
    return filters;
  }
});

export const parseSearchParamsToTokens = base.parseSearchParamsToTokens;
export const tokensToSearchParams = base.tokensToSearchParams;
export const tokensToFilters = base.tokensToFilters;
export const parseSearchParamsToFilters = base.parseSearchParamsToFilters;
export const normalizeInputToToken = base.normalizeInputToToken;
export type ProjectFilterToken = FilterToken;
