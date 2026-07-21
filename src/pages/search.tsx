import type { Message } from "@honcho-ai/sdk";
import { Loader2Icon, SearchIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { JsonViewer } from "@/components/json-viewer";
import {
  EmptyState,
  ErrorState,
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useHoncho } from "@/context/honcho-context";
import { formatError } from "@/lib/honcho";

export function SearchPage() {
  const { client } = useHoncho();
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState("25");
  const [results, setResults] = useState<Message[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function runSearch(event?: React.FormEvent) {
    event?.preventDefault();
    if (!client || !query.trim()) return;
    setSearching(true);
    setError(null);
    setSearched(true);
    try {
      const parsedLimit = Math.min(
        100,
        Math.max(1, Number.parseInt(limit, 10) || 25),
      );
      const messages = await client.search(query.trim(), {
        limit: parsedLimit,
      });
      setResults(messages);
    } catch (err) {
      setError(formatError(err));
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Search"
        description="Semantic search across messages in the active workspace."
        actions={
          searched ? (
            <Button
              variant="outline"
              size="sm"
              disabled={searching || !query.trim()}
              onClick={() => void runSearch()}
              aria-label="Refresh search results"
            >
              {searching ? (
                <Loader2Icon
                  data-icon="inline-start"
                  className="animate-spin"
                />
              ) : (
                <SearchIcon data-icon="inline-start" />
              )}
              Search again
            </Button>
          ) : null
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Workspace search</CardTitle>
          <CardDescription>
            Uses Honcho&apos;s workspace-level search endpoint.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={runSearch} className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3">
              <Field className="min-w-64 flex-1">
                <FieldLabel htmlFor="workspace-search">Query</FieldLabel>
                <Input
                  id="workspace-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="What did they say about pricing?"
                  className="text-base md:text-sm"
                />
              </Field>
              <Field className="w-28">
                <FieldLabel htmlFor="limit">Limit</FieldLabel>
                <Input
                  id="limit"
                  value={limit}
                  onChange={(event) => setLimit(event.target.value)}
                  inputMode="numeric"
                  className="font-tabular text-base md:text-sm"
                />
              </Field>
            </div>
            <Button type="submit" disabled={searching} className="w-fit">
              {searching ? (
                <Loader2Icon
                  data-icon="inline-start"
                  className="animate-spin"
                />
              ) : (
                <SearchIcon data-icon="inline-start" />
              )}
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <ErrorState inline message={error} onRetry={() => void runSearch()} />
      ) : null}

      {searched && !searching && results.length === 0 && !error ? (
        <EmptyState
          title="No results"
          description="Try a different query or increase the result limit."
        />
      ) : null}

      {results.length > 0 ? (
        <>
          <TableFrame>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Peer</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 font-mono"
                        render={
                          <Link
                            to={`/peers/${encodeURIComponent(message.peerId)}`}
                          />
                        }
                      >
                        {message.peerId}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 font-mono"
                        render={
                          <Link
                            to={`/sessions/${encodeURIComponent(message.sessionId)}`}
                          />
                        }
                      >
                        {message.sessionId}
                      </Button>
                    </TableCell>
                    <TableCell className="max-w-md truncate text-sm">
                      {message.content}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground font-tabular">
                      {new Date(message.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableFrame>
          <JsonViewer
            value={results.map((m) => ({
              id: m.id,
              peerId: m.peerId,
              sessionId: m.sessionId,
              content: m.content,
              createdAt: m.createdAt,
              metadata: m.metadata,
            }))}
            className="h-72"
            title="Raw results"
          />
        </>
      ) : null}
    </div>
  );
}
