"use client";
import { Tag, TagVariant } from "@/components/ui/tag";
import React from "react";

export interface BadgeData {
  status?: string | null;
  componentsCount?: number | null;
  tags?: { id?: number | string; name: string }[] | string[];
  /** When true, omit rendering the status badge */
  hideStatus?: boolean;
  /** When true, render an informational unique badge */
  unique?: boolean;
  /** Provide explicit variant mapping override */
  statusVariantMap?: Partial<Record<string, TagVariant>>;
  /** Class name applied to outer wrapper */
  className?: string;
  /** Size style context (currently only adjusts text sizing) */
  size?: "sm" | "xs";
}

const DEFAULT_VARIANTS: Record<string, TagVariant> = {
  active: "success",
  inactive: "warning",
  archived: "error",
};

/**
 * ItemBadges: Reusable presentation for an item's status, components count, and tags.
 * Accepts loose data shapes from both list rows and detail view.
 */
export function Badges({
  status,
  componentsCount,
  tags,
  hideStatus = false,
  unique = false,
  statusVariantMap,
  className = "",
  size = "sm",
}: BadgeData) {
  const vmap = { ...DEFAULT_VARIANTS, ...statusVariantMap };
  const variant = status ? vmap[status] ?? "default" : "default";
  const textSize = size === "xs" ? "text-[10px]" : "text-xs";
  const normTags: { key: string | number; name: string }[] = (tags || []).map(
    (t: any, i: number) =>
      typeof t === "string"
        ? { key: t, name: t }
        : { key: t.id ?? `${i}-${t.name}`, name: t.name }
  );
  return (
    <div className={`flex flex-wrap gap-1 ${textSize} ${className}`.trim()}>
      {!hideStatus && status && <Tag variant={variant}>{status}</Tag>}
      {unique && <Tag variant="info">Unique</Tag>}
      {typeof componentsCount === "number" && componentsCount > 0 && (
        <Tag variant="warning">{componentsCount} comps</Tag>
      )}
      {normTags.map((t) => (
        <Tag key={t.key} variant="default">
          {t.name}
        </Tag>
      ))}
    </div>
  );
}

export default Badges;
