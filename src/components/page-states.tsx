import { AlertCircleIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        {breadcrumb ? <div className="mb-0.5">{breadcrumb}</div> : null}
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <div className="max-w-[65ch] text-sm text-muted-foreground">
            {description}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function LoadingBlock({
  rows = 5,
  variant = "table",
}: {
  rows?: number;
  variant?: "table" | "cards" | "thread";
}) {
  if (variant === "cards") {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: Math.min(rows, 4) }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (variant === "thread") {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "flex flex-col gap-2",
              index % 2 === 0 ? "items-start" : "items-end",
            )}
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton
              className={cn(
                "h-16 rounded-lg",
                index % 2 === 0 ? "w-3/4" : "w-2/3",
              )}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="border-b bg-muted/40 px-3 py-2">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex flex-col gap-0 divide-y">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 px-3 py-2.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="ml-auto h-4 w-28" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  inline = false,
  title = "Something went wrong",
}: {
  message: string;
  onRetry?: () => void;
  inline?: boolean;
  title?: string;
}) {
  if (inline) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
        {onRetry ? (
          <div className="col-start-2 mt-2">
            <Button size="sm" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          </div>
        ) : null}
      </Alert>
    );
  }

  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
      {onRetry ? (
        <EmptyContent>
          <Button variant="outline" onClick={onRetry}>
            Retry
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        {description ? (
          <EmptyDescription>{description}</EmptyDescription>
        ) : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}

export function PaginationBar({
  page,
  pages,
  total,
  onPageChange,
  disabled = false,
}: {
  page: number;
  pages: number;
  total?: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground font-tabular">
        Page {page} of {pages}
        {typeof total === "number" ? <> · {total} total</> : null}
      </span>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={disabled || page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export function TableFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-lg border", className)}>
      {children}
    </div>
  );
}
