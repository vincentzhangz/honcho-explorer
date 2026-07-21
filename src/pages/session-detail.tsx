import type { Message, Peer, Session } from "@honcho-ai/sdk";
import { Loader2Icon, PlusIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/crud/confirm-delete-dialog";
import { CreateEntityDialog } from "@/components/crud/create-entity-dialog";
import { JsonEditor } from "@/components/crud/json-editor";
import { JsonViewer } from "@/components/json-viewer";
import { MessageThread } from "@/components/message-thread";
import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  PaginationBar,
  TableFrame,
} from "@/components/page-states";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useHoncho } from "@/context/honcho-context";
import { formatError } from "@/lib/honcho";

export function SessionDetailPage() {
  const { sessionId = "" } = useParams();
  const decodedId = decodeURIComponent(sessionId);
  const { client } = useHoncho();
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [metadata, setMetadata] = useState<Record<string, unknown> | null>(
    null,
  );
  const [configuration, setConfiguration] = useState<unknown>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagePage, setMessagePage] = useState(1);
  const [messagePages, setMessagePages] = useState(1);
  const [context, setContext] = useState<unknown>(null);
  const [summaries, setSummaries] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [repPeerId, setRepPeerId] = useState("");
  const [representation, setRepresentation] = useState<string>("");
  const [loadingRep, setLoadingRep] = useState(false);
  const [memoryError, setMemoryError] = useState<string | null>(null);

  const [composePeerId, setComposePeerId] = useState("");
  const [composeContent, setComposeContent] = useState("");
  const [composing, setComposing] = useState(false);

  const [addPeerOpen, setAddPeerOpen] = useState(false);
  const [addPeerId, setAddPeerId] = useState("");
  const [removePeerId, setRemovePeerId] = useState<string | null>(null);
  const [deleteSessionOpen, setDeleteSessionOpen] = useState(false);

  const [editMessage, setEditMessage] = useState<Message | null>(null);

  const load = useCallback(
    async (opts?: { soft?: boolean }) => {
      if (!client || !decodedId) return;
      if (!opts?.soft) setLoading(true);
      setError(null);
      try {
        const s = await client.session(decodedId);
        const [meta, config, peerList, messageResult, ctx, sums] =
          await Promise.all([
            s.getMetadata(),
            s.getConfiguration(),
            s.peers(),
            s.messages({ page: messagePage, size: 50, reverse: false }),
            s.context({ summary: true }),
            s.summaries(),
          ]);
        setSession(s);
        setMetadata(meta);
        setConfiguration(config);
        setPeers(peerList);
        setMessages(messageResult.items);
        setMessagePages(Math.max(messageResult.pages, 1));
        setContext({
          sessionId: ctx.sessionId,
          summary: ctx.summary
            ? {
                content: ctx.summary.content,
                messageId: ctx.summary.messageId,
                summaryType: ctx.summary.summaryType,
                createdAt: ctx.summary.createdAt,
                tokenCount: ctx.summary.tokenCount,
              }
            : null,
          peerRepresentation: ctx.peerRepresentation,
          peerCard: ctx.peerCard,
          messageCount: ctx.messages.length,
          messages: ctx.messages.map((m) => ({
            id: m.id,
            peerId: m.peerId,
            content: m.content,
            createdAt: m.createdAt,
          })),
        });
        setSummaries({
          sessionId: sums.sessionId,
          shortSummary: sums.shortSummary
            ? {
                content: sums.shortSummary.content,
                createdAt: sums.shortSummary.createdAt,
                tokenCount: sums.shortSummary.tokenCount,
              }
            : null,
          longSummary: sums.longSummary
            ? {
                content: sums.longSummary.content,
                createdAt: sums.longSummary.createdAt,
                tokenCount: sums.longSummary.tokenCount,
              }
            : null,
        });
        setRepPeerId((current) => current || peerList[0]?.id || "");
        setComposePeerId((current) => current || peerList[0]?.id || "");
      } catch (err) {
        setError(formatError(err));
      } finally {
        setLoading(false);
      }
    },
    [client, decodedId, messagePage],
  );

  useEffect(() => {
    void load();
  }, [load]);

  async function runSearch(event?: React.FormEvent) {
    event?.preventDefault();
    if (!session || !searchQuery.trim()) return;
    setSearching(true);
    setSearchError(null);
    setHasSearched(true);
    try {
      const results = await session.search(searchQuery.trim(), { limit: 25 });
      setSearchResults(results);
    } catch (err) {
      setSearchError(formatError(err));
    } finally {
      setSearching(false);
    }
  }

  async function loadRepresentation() {
    if (!session || !repPeerId.trim()) return;
    setLoadingRep(true);
    setMemoryError(null);
    try {
      const rep = await session.representation(repPeerId.trim());
      setRepresentation(rep);
    } catch (err) {
      setMemoryError(formatError(err));
    } finally {
      setLoadingRep(false);
    }
  }

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!client || !session) return;
    const peerId = composePeerId.trim();
    const content = composeContent.trim();
    if (!peerId || !content) {
      toast.error("Peer ID and content are required");
      return;
    }
    setComposing(true);
    try {
      const peer = await client.peer(peerId);
      await session.addMessages(peer.message(content));
      setComposeContent("");
      toast.success("Message added");
      await load();
    } catch (err) {
      toast.error("Failed to add message", { description: formatError(err) });
    } finally {
      setComposing(false);
    }
  }

  if (loading && !session) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Session" />
        <LoadingBlock rows={8} />
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Session" />
        <ErrorState message={error} onRetry={() => void load()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={decodedId}
        description="Messages, peers, context, summaries, representation, and search."
        actions={
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteSessionOpen(true)}
            >
              <Trash2Icon data-icon="inline-start" />
              Delete
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-label="Refresh session"
              onClick={() => void load({ soft: true })}
            >
              <RefreshCwIcon data-icon="inline-start" />
              Refresh
            </Button>
          </div>
        }
      />

      {error ? (
        <ErrorState inline message={error} onRetry={() => void load()} />
      ) : null}

      <ConfirmDeleteDialog
        open={deleteSessionOpen}
        onOpenChange={setDeleteSessionOpen}
        title="Delete session"
        description={`Permanently delete session ${decodedId} and all its messages?`}
        onConfirm={async () => {
          if (!session) return;
          try {
            await session.delete();
            toast.success(`Deleted ${decodedId}`);
            navigate("/sessions");
          } catch (err) {
            toast.error("Delete failed", { description: formatError(err) });
          }
        }}
      />

      <Tabs defaultValue="messages">
        <TabsList>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="peers">Peers</TabsTrigger>
          <TabsTrigger value="context">Context</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Compose message</CardTitle>
              <CardDescription>
                Add a message attributed to a peer in this session.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={sendMessage} className="flex flex-col gap-3">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="compose-peer">Peer ID</FieldLabel>
                    <Input
                      id="compose-peer"
                      value={composePeerId}
                      onChange={(event) => setComposePeerId(event.target.value)}
                      className="font-mono"
                      placeholder="alice"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="compose-content">Content</FieldLabel>
                    <Textarea
                      id="compose-content"
                      value={composeContent}
                      onChange={(event) =>
                        setComposeContent(event.target.value)
                      }
                      rows={3}
                    />
                  </Field>
                </FieldGroup>
                <Button type="submit" disabled={composing} className="w-fit">
                  {composing ? (
                    <Loader2Icon
                      data-icon="inline-start"
                      className="animate-spin"
                    />
                  ) : null}
                  Send
                </Button>
              </form>
            </CardContent>
          </Card>

          <MessageThread
            messages={messages}
            onEdit={(message) => setEditMessage(message)}
          />
          {messages.length > 0 ? (
            <PaginationBar
              page={messagePage}
              pages={messagePages}
              onPageChange={setMessagePage}
            />
          ) : null}

          <Dialog
            open={Boolean(editMessage)}
            onOpenChange={(open) => {
              if (!open) setEditMessage(null);
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update message metadata</DialogTitle>
                <DialogDescription>
                  {editMessage
                    ? `Message ${editMessage.id}`
                    : "Update metadata JSON for this message."}
                </DialogDescription>
              </DialogHeader>
              {editMessage ? (
                <JsonEditor
                  label="Metadata JSON"
                  value={editMessage.metadata}
                  saveLabel="Save metadata"
                  onSave={async (parsed) => {
                    if (!session || !editMessage) return;
                    await session.updateMessage(
                      editMessage.id,
                      parsed as Record<string, unknown>,
                    );
                    toast.success("Message metadata updated");
                    setEditMessage(null);
                    await load();
                  }}
                />
              ) : null}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="peers" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                setAddPeerId("");
                setAddPeerOpen(true);
              }}
            >
              <PlusIcon data-icon="inline-start" />
              Add peer
            </Button>
          </div>

          {peers.length === 0 ? (
            <EmptyState
              title="No peers in session"
              description="Add a peer to attribute messages in this session."
              action={
                <Button
                  size="sm"
                  onClick={() => {
                    setAddPeerId("");
                    setAddPeerOpen(true);
                  }}
                >
                  <PlusIcon data-icon="inline-start" />
                  Add peer
                </Button>
              }
            />
          ) : (
            <TableFrame>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Peer ID</TableHead>
                    <TableHead className="w-40 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {peers.map((peer) => (
                    <TableRow key={peer.id}>
                      <TableCell className="font-mono text-sm">
                        {peer.id}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            render={
                              <Link
                                to={`/peers/${encodeURIComponent(peer.id)}`}
                              />
                            }
                          >
                            View
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Remove peer ${peer.id}`}
                            title="Remove peer"
                            onClick={() => setRemovePeerId(peer.id)}
                          >
                            <Trash2Icon />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableFrame>
          )}

          <CreateEntityDialog
            open={addPeerOpen}
            onOpenChange={setAddPeerOpen}
            title="Add peer to session"
            submitLabel="Add"
            onSubmit={async () => {
              if (!session) return "Session not loaded.";
              const id = addPeerId.trim();
              if (!id) return "Peer ID is required.";
              try {
                await session.addPeers(id);
                toast.success(`Added ${id}`);
                return null;
              } catch (err) {
                return formatError(err);
              }
            }}
            onSuccess={() => void load()}
          >
            <Field>
              <FieldLabel htmlFor="add-peer">Peer ID</FieldLabel>
              <Input
                id="add-peer"
                value={addPeerId}
                onChange={(event) => setAddPeerId(event.target.value)}
                className="font-mono"
              />
            </Field>
          </CreateEntityDialog>

          <ConfirmDeleteDialog
            open={Boolean(removePeerId)}
            onOpenChange={(open) => {
              if (!open) setRemovePeerId(null);
            }}
            title="Remove peer"
            description={`Remove peer ${removePeerId} from this session?`}
            confirmLabel="Remove"
            onConfirm={async () => {
              if (!session || !removePeerId) return;
              try {
                await session.removePeers(removePeerId);
                toast.success(`Removed ${removePeerId}`);
                setRemovePeerId(null);
                await load();
              } catch (err) {
                toast.error("Remove failed", {
                  description: formatError(err),
                });
              }
            }}
          />
        </TabsContent>

        <TabsContent value="context" className="flex flex-col gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Session context</CardTitle>
              </CardHeader>
              <CardContent>
                <JsonViewer
                  value={context}
                  title="Context"
                  maxHeightClass="h-96"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Summaries</CardTitle>
              </CardHeader>
              <CardContent>
                <JsonViewer
                  value={summaries}
                  title="Summaries"
                  maxHeightClass="h-96"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="memory" className="flex flex-col gap-4">
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void loadRepresentation();
            }}
          >
            <Field className="min-w-64 flex-1">
              <FieldLabel htmlFor="rep-peer">
                Peer ID for representation
              </FieldLabel>
              <Input
                id="rep-peer"
                value={repPeerId}
                onChange={(event) => setRepPeerId(event.target.value)}
                placeholder="peer-id"
                className="font-mono text-base md:text-sm"
              />
            </Field>
            <Button type="submit" disabled={loadingRep}>
              {loadingRep ? (
                <Loader2Icon
                  data-icon="inline-start"
                  className="animate-spin"
                />
              ) : null}
              Load representation
            </Button>
          </form>
          {memoryError ? (
            <ErrorState
              inline
              message={memoryError}
              onRetry={() => void loadRepresentation()}
            />
          ) : null}
          <JsonViewer
            value={representation}
            title="Representation"
            maxHeightClass="h-96"
          />
        </TabsContent>

        <TabsContent value="search" className="flex flex-col gap-4">
          <form onSubmit={runSearch} className="flex flex-wrap items-end gap-2">
            <Field className="min-w-64 flex-1">
              <FieldLabel htmlFor="session-search">
                Search in session
              </FieldLabel>
              <Input
                id="session-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="help"
                className="text-base md:text-sm"
              />
            </Field>
            <Button type="submit" disabled={searching}>
              {searching ? (
                <Loader2Icon
                  data-icon="inline-start"
                  className="animate-spin"
                />
              ) : null}
              Search
            </Button>
          </form>
          {searchError ? (
            <ErrorState
              inline
              message={searchError}
              onRetry={() => void runSearch()}
            />
          ) : null}
          {hasSearched &&
          searchResults.length === 0 &&
          !searchError &&
          !searching ? (
            <EmptyState
              title="No search results"
              description="Try a different query for this session."
            />
          ) : null}
          {searchResults.length > 0 ? (
            <JsonViewer
              value={searchResults.map((m) => ({
                id: m.id,
                peerId: m.peerId,
                content: m.content,
                createdAt: m.createdAt,
              }))}
              title="Search results"
              maxHeightClass="h-96"
            />
          ) : null}
        </TabsContent>

        <TabsContent value="overview" className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>
                {session?.isActive === undefined
                  ? "Active state unknown"
                  : session.isActive
                    ? "Session is active"
                    : "Session is inactive"}
                {session?.createdAt
                  ? ` - Created ${new Date(session.createdAt).toLocaleString()}`
                  : ""}
              </CardDescription>
            </CardHeader>
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <JsonEditor
                  label="Metadata JSON"
                  value={metadata ?? {}}
                  onSave={async (parsed) => {
                    if (!session) return;
                    await session.setMetadata(
                      parsed as Record<string, unknown>,
                    );
                    setMetadata(parsed as Record<string, unknown>);
                    toast.success("Metadata saved");
                  }}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <JsonEditor
                  label="Configuration JSON"
                  value={configuration ?? {}}
                  onSave={async (parsed) => {
                    if (!session) return;
                    await session.setConfiguration(
                      parsed as Parameters<Session["setConfiguration"]>[0],
                    );
                    setConfiguration(parsed);
                    toast.success("Configuration saved");
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
