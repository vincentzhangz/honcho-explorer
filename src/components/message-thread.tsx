import type { Message } from "@honcho-ai/sdk";
import { PencilIcon, Trash2Icon } from "lucide-react";

import { EmptyState } from "@/components/page-states";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type MessageThreadProps = {
  messages: Message[];
  onEdit?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  className?: string;
};

export function MessageThread({
  messages,
  onEdit,
  onDelete,
  className,
}: MessageThreadProps) {
  if (messages.length === 0) {
    return (
      <EmptyState
        title="No messages"
        description="Compose a message below to start this session."
      />
    );
  }

  return (
    <ScrollArea className={cn("h-[420px] rounded-lg border", className)}>
      <div className="flex flex-col gap-3 p-3">
        {messages.map((message) => (
          <article
            key={message.id}
            className="group rounded-lg border bg-card px-3 py-2.5"
          >
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-medium">
                {message.peerId}
              </span>
              <span className="text-xs text-muted-foreground font-tabular">
                {new Date(message.createdAt).toLocaleString()}
              </span>
              <span className="truncate font-mono text-[10px] text-muted-foreground">
                {message.id}
              </span>
              {(onEdit || onDelete) && (
                <div className="ml-auto flex gap-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  {onEdit ? (
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      aria-label={`Edit metadata for message ${message.id}`}
                      title="Edit metadata"
                      onClick={() => onEdit(message)}
                    >
                      <PencilIcon />
                    </Button>
                  ) : null}
                  {onDelete ? (
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      aria-label={`Delete message ${message.id}`}
                      onClick={() => onDelete(message)}
                    >
                      <Trash2Icon />
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </article>
        ))}
      </div>
    </ScrollArea>
  );
}
