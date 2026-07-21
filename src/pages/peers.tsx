import type { Peer } from "@honcho-ai/sdk";
import { PlusIcon, RefreshCwIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { CreateEntityDialog } from "@/components/crud/create-entity-dialog";
import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  PaginationBar,
  TableFrame,
} from "@/components/page-states";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { useHoncho } from "@/context/honcho-context";
import { formatError } from "@/lib/honcho";

export function PeersPage() {
  const { client } = useHoncho();
  const navigate = useNavigate();
  const [peers, setPeers] = useState<Peer[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newId, setNewId] = useState("");
  const [newMetadata, setNewMetadata] = useState("{}");

  const openCreate = () => {
    setNewId("");
    setNewMetadata("{}");
    setCreateOpen(true);
  };

  const load = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    setError(null);
    try {
      const result = await client.peers({ page, size: 25, reverse: true });
      setPeers(result.items);
      setPages(Math.max(result.pages, 1));
      setTotal(result.total);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  }, [client, page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Peers"
        description={
          <span className="font-tabular">
            {total} peer{total === 1 ? "" : "s"} in this workspace.
          </span>
        }
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void load()}
              aria-label="Refresh peers"
            >
              <RefreshCwIcon data-icon="inline-start" />
              Refresh
            </Button>
            <Button size="sm" onClick={openCreate}>
              <PlusIcon data-icon="inline-start" />
              Create peer
            </Button>
          </div>
        }
      />

      <CreateEntityDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create peer"
        description="Get-or-create a peer by ID in the active workspace."
        submitLabel="Create"
        onSubmit={async () => {
          if (!client) return "Not connected.";
          const id = newId.trim();
          if (!id) return "Peer ID is required.";
          let metadata: Record<string, unknown> | undefined;
          try {
            const parsed = JSON.parse(newMetadata || "{}") as unknown;
            if (
              parsed !== null &&
              typeof parsed === "object" &&
              !Array.isArray(parsed)
            ) {
              metadata = parsed as Record<string, unknown>;
            } else {
              return "Metadata must be a JSON object.";
            }
          } catch {
            return "Invalid metadata JSON.";
          }
          try {
            const peer = await client.peer(id, {
              ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
            });
            toast.success(`Peer ${peer.id} ready`);
            navigate(`/peers/${encodeURIComponent(peer.id)}`);
            return null;
          } catch (err) {
            return formatError(err);
          }
        }}
        onSuccess={() => void load()}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="peer-id">Peer ID</FieldLabel>
            <Input
              id="peer-id"
              value={newId}
              onChange={(event) => setNewId(event.target.value)}
              placeholder="alice"
              className="font-mono text-base md:text-sm"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="peer-metadata">Metadata (JSON)</FieldLabel>
            <Textarea
              id="peer-metadata"
              value={newMetadata}
              onChange={(event) => setNewMetadata(event.target.value)}
              rows={5}
              className="font-mono text-xs"
            />
          </Field>
        </FieldGroup>
      </CreateEntityDialog>

      {loading ? <LoadingBlock /> : null}
      {error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : null}

      {!loading && !error && peers.length === 0 ? (
        <EmptyState
          title="No peers yet"
          description="Create a peer to get started."
          action={
            <Button size="sm" onClick={openCreate}>
              <PlusIcon data-icon="inline-start" />
              Create peer
            </Button>
          }
        />
      ) : null}

      {!loading && !error && peers.length > 0 ? (
        <>
          <TableFrame>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Peer ID</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-28 text-right">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {peers.map((peer) => (
                  <TableRow
                    key={peer.id}
                    className="cursor-pointer"
                    onClick={() =>
                      navigate(`/peers/${encodeURIComponent(peer.id)}`)
                    }
                  >
                    <TableCell className="font-mono text-sm">
                      {peer.id}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-tabular">
                      {peer.createdAt
                        ? new Date(peer.createdAt).toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        render={
                          <Link to={`/peers/${encodeURIComponent(peer.id)}`} />
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

          <PaginationBar
            page={page}
            pages={pages}
            total={total}
            onPageChange={setPage}
          />
        </>
      ) : null}
    </div>
  );
}
