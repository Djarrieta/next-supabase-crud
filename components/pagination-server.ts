// Server-side pagination helpers (no "use client").
// These can be safely imported by server components without forcing a client bundle.

export interface ParsePaginationParams {
  searchParams?: Record<string, string | string[] | undefined>;
  defaultPageSize: number;
  maxPageSize: number; // upper bound (values above clamped)
}

export interface ParsedPagination {
  page: number;
  pageSize: number;
}

/**
 * Safely parse pagination params from Next.js searchParams.
 */
export function parsePagination({
  searchParams,
  defaultPageSize,
  maxPageSize,
}: ParsePaginationParams): ParsedPagination {
  const rawPage = searchParams?.page;
  const rawPageSize = searchParams?.pageSize;
  const parsedPage = Number(Array.isArray(rawPage) ? rawPage[0] : rawPage);
  const parsedPageSize = Number(
    Array.isArray(rawPageSize) ? rawPageSize[0] : rawPageSize
  );
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  let pageSize =
    Number.isFinite(parsedPageSize) && parsedPageSize > 0
      ? parsedPageSize
      : defaultPageSize;
  if (pageSize > maxPageSize) pageSize = maxPageSize;
  return { page, pageSize };
}

export interface PageHrefBuilderOptions {
  pageSize: number;
  defaultPageSize: number; // used to omit param if same
  extraParams?: Record<string, string | number | boolean | undefined | null>;
}

/**
 * Create a function that builds stable pagination hrefs preserving additional params.
 */
export function createPageHrefBuilder(
  basePath: string,
  { pageSize, defaultPageSize, extraParams }: PageHrefBuilderOptions
): (targetPage: number) => string {
  return (targetPage: number) => {
    const params = new URLSearchParams();
    if (targetPage !== 1) params.set("page", String(targetPage));
    if (pageSize !== defaultPageSize) params.set("pageSize", String(pageSize));
    if (extraParams) {
      for (const [k, v] of Object.entries(extraParams)) {
        if (v === undefined || v === null) continue;
        const str = String(v);
        if (!str) continue;
        params.set(k, str);
      }
    }
    const search = params.toString();
    return `${basePath}${search ? `?${search}` : ""}`;
  };
}
