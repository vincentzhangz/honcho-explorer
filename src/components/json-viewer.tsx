import { CheckIcon, ChevronDownIcon, CopyIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type JsonViewerProps = {
  value: unknown;
  className?: string;
  title?: string;
  defaultCollapsed?: boolean;
  maxHeightClass?: string;
};

export function JsonViewer({
  value,
  className,
  title,
  defaultCollapsed = false,
  maxHeightClass = "h-72",
}: JsonViewerProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [copied, setCopied] = useState(false);

  const text = useMemo(() => {
    if (typeof value === "string") return value || "(empty)";
    try {
      return JSON.stringify(value, null, 2) ?? "null";
    } catch {
      return String(value);
    }
  }, [value]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy");
    }
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border bg-card", className)}>
      <div className="flex items-center gap-2 border-b bg-muted/40 px-2 py-1.5">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={collapsed ? "Expand JSON" : "Collapse JSON"}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((c) => !c)}
        >
          <ChevronDownIcon
            className={cn(
              "size-4 transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out)]",
              collapsed && "-rotate-90",
            )}
          />
        </Button>
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-muted-foreground">
          {title ?? "JSON"}
        </span>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Copy JSON"
          onClick={() => void handleCopy()}
        >
          {copied ? (
            <CheckIcon className="size-3.5 text-success" />
          ) : (
            <CopyIcon className="size-3.5" />
          )}
        </Button>
      </div>
      {!collapsed ? (
        <ScrollArea className={maxHeightClass}>
          <pre className="p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words text-muted-foreground">
            {text}
          </pre>
        </ScrollArea>
      ) : null}
    </div>
  );
}
