"use client";
import React from "react";
import Link from "next/link";
import {
  Breadcrumb as Root,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export interface CrumbItem {
  label: string;
  href?: string;
}

interface Props {
  items: CrumbItem[];
  className?: string;
  separator?: React.ReactNode;
}

/**
 * Wrapper component preserving the previous <Breadcrumb items=[...]> API
 * while using shadcn/ui breadcrumb primitives.
 */
export default function Breadcrumb({ items, className, separator }: Props) {
  if (!items || items.length === 0) return null;
  return (
    <Root className={className}>
      <BreadcrumbList>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <BreadcrumbItem key={idx}>
              {isLast || !item.href ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              )}
              {!isLast && (
                <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Root>
  );
}
