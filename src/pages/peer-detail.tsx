import type { Conclusion, Peer, Session } from "@honcho-ai/sdk";
import { Loader2Icon, PlusIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/crud/confirm-delete-dialog";
import { CreateEntityDialog } from "@/components/crud/create-entity-dialog";
import { JsonEditor } from "@/components/crud/json-editor";
import { JsonViewer } from "@/components/json-viewer";
import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
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

export function PeerDetailPage() {
  const { peerId = "" } = useParams();
  const decodedId = decodeURIComponent(peerId);
  const { client } = useHoncho();

  const [peer, setPeer] = useState<Peer | null>(null);
  const [metadata, setMetadata] = useState<Record<string, unknown> | null>(
    null,
  );
  const [configuration, setConfiguration] = useState<unknown>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [representation, setRepresentation] = useState<string>("");
  const [context, setContext] = useState<unknown>(null);
  const [card, setCard] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<unknown[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [chatQuery, setChatQuery] = useState("");
  const [chatTarget, setChatTarget] = useState("");
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [chatting, setChatting] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const [repSearch, setRepSearch] = useState("");
  const [loadingMemory, setLoadingMemory] = useState(false);
  const [memoryError, setMemoryError] = useState<string | null>(null);

  const [conclusions, setConclusions] = useState<Conclusion[]>([]);
  const [createConclusionOpen, setCreateConclusionOpen] = useState(false);
  const [conclusionContent, setConclusionContent] = useState("");
  const [deleteConclusionId, setDeleteConclusionId] = useState<string | null>(
    null,
  );

  const load = useCallback(
    async (opts?: { soft?: boolean }) => {
      if (!client || !decodedId) return;
      if (!opts?.soft) setLoading(true);
      setError(null);
      try {
        const p = await client.peer(decodedId);
        const [meta, config, sessionPage, rep, ctx, peerCard, conclusionPage] =
          await Promise.all([
            p.getMetadata(),
            p.getConfiguration(),
            p.sessions({ page: 1, size: 50, reverse: true }),
            p.representation(),
            p.context(),
            p.getCard(),
            p.conclusions.list({ page: 1, size: 50, reverse: true }),
          ]);
        setPeer(p);
        setMetadata(meta);
        setConfiguration(config);
        setSessions(sessionPage.items);
        setRepresentation(rep);
        setContext({
          peerId: ctx.peerId,
          targetId: ctx.targetId,
          representation: ctx.representation,
          peerCard: ctx.peerCard,
        });
        setCard(peerCard);
        setConclusions(conclusionPage.items);
      } catch (err) {
        setError(formatError(err));
      } finally {
        setLoading(false);
      }
    },
    [client, decodedId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  async function refreshMemory() {
    if (!peer) return;
    setLoadingMemory(true);
    setMemoryError(null);
    try {
      const [rep, ctx, peerCard] = await Promise.all([
        peer.representation(
          repSearch.trim()
            ? { searchQuery: repSearch.trim(), searchTopK: 10 }
            : undefined,
        ),
        peer.context(
          repSearch.trim()
            ? { searchQuery: repSearch.trim(), searchTopK: 10 }
            : undefined,
        ),
        peer.getCard(),
      ]);
      setRepresentation(rep);
      setContext({
        peerId: ctx.peerId,
        targetId: ctx.targetId,
        representation: ctx.representation,
        peerCard: ctx.peerCard,
      });
      setCard(peerCard);
    } catch (err) {
      setMemoryError(formatError(err));
    } finally {
      setLoadingMemory(false);
    }
  }

  async function runSearch(event?: React.FormEvent) {
    event?.preventDefault();
    if (!peer || !searchQuery.trim()) return;
    setSearching(true);
    setSearchError(null);
    setHasSearched(true);
    try {
      const results = await peer.search(searchQuery.trim(), { limit: 25 });
      setSearchResults(results);
    } catch (err) {
      setSearchError(formatError(err));
    } finally {
      setSearching(false);
    }
  }

  async function runChat(event?: React.FormEvent) {
    event?.preventDefault();
    if (!peer || !chatQuery.trim()) return;
    setChatting(true);
    setChatResponse(null);
    setChatError(null);
    try {
      const response = await peer.chat(chatQuery.trim(), {
        ...(chatTarget.trim() ? { target: chatTarget.trim() } : {}),
      });
      setChatResponse(response);
    } catch (err) {
      setChatError(formatError(err));
    } finally {
      setChatting(false);
    }
  }

  if (loading && !peer) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Peer" />
        <LoadingBlock rows={8} />
      </div>
    );
  }

  if (error && !peer) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Peer" />
        <ErrorState message={error} onRetry={() => void load()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={decodedId}
        description="Peer metadata, sessions, representations, search, and dialectic chat."
        actions={
          <Button
            variant="outline"
            size="sm"
            aria-label="Refresh peer"
            onClick={() => void load({ soft: true })}
          >
            <RefreshCwIcon data-icon="inline-start" />
            Refresh
          </Button>
        }
      />

      {error ? (
        <ErrorState inline message={error} onRetry={() => void load()} />
      ) : null}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="conclusions">Conclusions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
                <CardDescription>
                  Edit and save peer metadata JSON.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <JsonEditor
                  label="Metadata JSON"
                  value={metadata ?? {}}
                  onSave={async (parsed) => {
                    if (!peer) return;
                    await peer.setMetadata(parsed as Record<string, unknown>);
                    setMetadata(parsed as Record<string, unknown>);
                    toast.success("Metadata saved");
                  }}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>
                  Peer config (e.g. {'{ "observeMe": true }'}).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <JsonEditor
                  label="Configuration JSON"
                  value={configuration ?? {}}
                  onSave={async (parsed) => {
                    if (!peer) return;
                    await peer.setConfiguration(
                      parsed as { observeMe?: boolean | null },
                    );
                    setConfiguration(parsed);
                    toast.success("Configuration saved");
                  }}
                />
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Peer card</CardTitle>
              <CardDescription>
                Array of strings forming the biographical card.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JsonEditor
                label="Peer card JSON array"
                value={card ?? []}
                objectOnly={false}
                onSave={async (parsed) => {
                  if (!peer) return;
                  if (
                    !Array.isArray(parsed) ||
                    !parsed.every((x) => typeof x === "string")
                  ) {
                    throw new Error("Peer card must be an array of strings.");
                  }
                  const updated = await peer.setCard(parsed as string[]);
                  setCard(updated);
                  toast.success("Peer card saved");
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memory" className="flex flex-col gap-4">
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void refreshMemory();
            }}
          >
            <Field className="min-w-64 flex-1">
              <FieldLabel htmlFor="rep-search">
                Semantic filter (optional)
              </FieldLabel>
              <Input
                id="rep-search"
                value={repSearch}
                onChange={(event) => setRepSearch(event.target.value)}
                placeholder="preferences"
              />
            </Field>
            <Button type="submit" disabled={loadingMemory}>
              {loadingMemory ? (
                <Loader2Icon
                  data-icon="inline-start"
                  className="animate-spin"
                />
              ) : null}
              Refresh memory
            </Button>
          </form>
          {memoryError ? (
            <ErrorState
              inline
              message={memoryError}
              onRetry={() => void refreshMemory()}
            />
          ) : null}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Representation</CardTitle>
              </CardHeader>
              <CardContent>
                <JsonViewer
                  value={representation}
                  title="Representation"
                  maxHeightClass="h-96"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Context</CardTitle>
              </CardHeader>
              <CardContent>
                <JsonViewer
                  value={context}
                  title="Context"
                  maxHeightClass="h-96"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="chat" className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Dialectic chat</CardTitle>
              <CardDescription>
                Ask natural-language questions against this peer&apos;s memory.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={runChat} className="flex flex-col gap-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="chat-query">Question</FieldLabel>
                    <Textarea
                      id="chat-query"
                      value={chatQuery}
                      onChange={(event) => setChatQuery(event.target.value)}
                      rows={3}
                      placeholder="What should I know about this peer?"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="chat-target">
                      Target peer ID (optional)
                    </FieldLabel>
                    <Input
                      id="chat-target"
                      value={chatTarget}
                      onChange={(event) => setChatTarget(event.target.value)}
                      placeholder="Query local representation of another peer"
                    />
                  </Field>
                </FieldGroup>
                <Button type="submit" disabled={chatting}>
                  {chatting ? (
                    <Loader2Icon
                      data-icon="inline-start"
                      className="animate-spin"
                    />
                  ) : null}
                  Ask
                </Button>
              </form>
              {chatError ? (
                <div className="mt-4">
                  <ErrorState
                    inline
                    message={chatError}
                    onRetry={() => void runChat()}
                  />
                </div>
              ) : null}
              {chatResponse !== null ? (
                <div className="mt-4">
                  <JsonViewer
                    value={chatResponse}
                    title="Response"
                    maxHeightClass="h-64"
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="flex flex-col gap-4">
          <form onSubmit={runSearch} className="flex flex-wrap items-end gap-2">
            <Field className="min-w-64 flex-1">
              <FieldLabel htmlFor="peer-search">
                Search messages by this peer
              </FieldLabel>
              <Input
                id="peer-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="programming"
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
              description="Try a different query for this peer."
            />
          ) : null}
          {searchResults.length > 0 ? (
            <JsonViewer
              value={searchResults}
              title="Search results"
              maxHeightClass="h-96"
            />
          ) : null}
        </TabsContent>

        <TabsContent value="sessions">
          {sessions.length === 0 ? (
            <EmptyState
              title="No sessions"
              description="This peer is not in any sessions yet."
            />
          ) : (
            <TableFrame>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session ID</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-28 text-right">Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-mono text-sm">
                        {session.id}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-tabular">
                        {session.createdAt
                          ? new Date(session.createdAt).toLocaleString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          render={
                            <Link
                              to={`/sessions/${encodeURIComponent(session.id)}`}
                            />
                          }
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableFrame>
          )}
        </TabsContent>

        <TabsContent value="conclusions" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                setConclusionContent("");
                setCreateConclusionOpen(true);
              }}
            >
              <PlusIcon data-icon="inline-start" />
              Add conclusion
            </Button>
          </div>

          {conclusions.length === 0 ? (
            <EmptyState
              title="No conclusions"
              description="Add a self-conclusion for this peer."
              action={
                <Button
                  size="sm"
                  onClick={() => {
                    setConclusionContent("");
                    setCreateConclusionOpen(true);
                  }}
                >
                  <PlusIcon data-icon="inline-start" />
                  Add conclusion
                </Button>
              }
            />
          ) : (
            <TableFrame>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Content</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-24 text-right">Delete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conclusions.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="max-w-md text-sm">
                        {item.content}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.level}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground font-tabular">
                        {new Date(item.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Delete conclusion ${item.id}`}
                          title="Delete conclusion"
                          onClick={() => setDeleteConclusionId(item.id)}
                        >
                          <Trash2Icon />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableFrame>
          )}

          <CreateEntityDialog
            open={createConclusionOpen}
            onOpenChange={setCreateConclusionOpen}
            title="Create conclusion"
            description="Add a self-conclusion for this peer."
            submitLabel="Create"
            onSubmit={async () => {
              if (!peer) return "Peer not loaded.";
              const content = conclusionContent.trim();
              if (!content) return "Content is required.";
              try {
                await peer.conclusions.create({ content });
                toast.success("Conclusion created");
                return null;
              } catch (err) {
                return formatError(err);
              }
            }}
            onSuccess={() => void load()}
          >
            <Field>
              <FieldLabel htmlFor="conclusion-content">Content</FieldLabel>
              <Textarea
                id="conclusion-content"
                value={conclusionContent}
                onChange={(event) => setConclusionContent(event.target.value)}
                rows={4}
              />
            </Field>
          </CreateEntityDialog>

          <ConfirmDeleteDialog
            open={Boolean(deleteConclusionId)}
            onOpenChange={(open) => {
              if (!open) setDeleteConclusionId(null);
            }}
            title="Delete conclusion"
            description={`Permanently delete conclusion ${deleteConclusionId}?`}
            onConfirm={async () => {
              if (!peer || !deleteConclusionId) return;
              try {
                await peer.conclusions.delete(deleteConclusionId);
                toast.success("Conclusion deleted");
                setDeleteConclusionId(null);
                await load();
              } catch (err) {
                toast.error("Delete failed", {
                  description: formatError(err),
                });
              }
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
