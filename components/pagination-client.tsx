"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ReactNode, useCallback } from "react";

export interface UsePaginationNavOptions {
  pageParam?: string;
  pageSizeParam?: string;
}

/** Simple hook to build an onPageChange handler that rewrites the URL (server pagination). */
export function usePaginationNav(opts: UsePaginationNavOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageParam = opts.pageParam || "page";
  return useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams?.toString());
      params.set(pageParam, String(newPage));
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams, pageParam]
  );
}

/** Wrapper component to inject client onPageChange into a server component TableTemplate via render prop. */
export function PaginationClientBridge({
  children,
  onPageChange,
}: {
  children: (onPageChange: (p: number) => void) => ReactNode;
  onPageChange: (p: number) => void;
}) {
  return <>{children(onPageChange)}</>;
}
