import type { Session } from "@honcho-ai/sdk";
import { PlusIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/crud/confirm-delete-dialog";
import { CreateEntityDialog } from "@/components/crud/create-entity-dialog";
import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  PaginationBar,
  TableFrame,
} from "@/components/page-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
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

export function SessionsPage() {
  const { client } = useHoncho();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newId, setNewId] = useState("");
  const [peerIds, setPeerIds] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setNewId("");
    setPeerIds("");
    setCreateOpen(true);
  };

  const load = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    setError(null);
    try {
      const result = await client.sessions({ page, size: 25, reverse: true });
      setSessions(result.items);
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
        title="Sessions"
        description={
          <span className="font-tabular">
            {total} session{total === 1 ? "" : "s"} in this workspace.
          </span>
        }
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void load()}
              aria-label="Refresh sessions"
            >
              <RefreshCwIcon data-icon="inline-start" />
              Refresh
            </Button>
            <Button size="sm" onClick={openCreate}>
              <PlusIcon data-icon="inline-start" />
              Create session
            </Button>
          </div>
        }
      />

      <CreateEntityDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create session"
        description="Get-or-create a session and optionally add peers."
        submitLabel="Create"
        onSubmit={async () => {
          if (!client) return "Not connected.";
          const id = newId.trim();
          if (!id) return "Session ID is required.";
          const peers = peerIds
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean);
          try {
            const session = await client.session(id);
            if (peers.length > 0) {
              await session.addPeers(peers);
            }
            toast.success(`Session ${session.id} ready`);
            navigate(`/sessions/${encodeURIComponent(session.id)}`);
            return null;
          } catch (err) {
            return formatError(err);
          }
        }}
        onSuccess={() => void load()}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="session-id">Session ID</FieldLabel>
            <Input
              id="session-id"
              value={newId}
              onChange={(event) => setNewId(event.target.value)}
              placeholder="conversation-1"
              className="font-mono text-base md:text-sm"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="session-peers">Peer IDs (optional)</FieldLabel>
            <Input
              id="session-peers"
              value={peerIds}
              onChange={(event) => setPeerIds(event.target.value)}
              placeholder="alice, bob"
              className="text-base md:text-sm"
            />
            <FieldDescription>
              Comma-separated peer IDs to add.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </CreateEntityDialog>

      <ConfirmDeleteDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title="Delete session"
        description={`Permanently delete session ${deleteId} and all its messages?`}
        onConfirm={async () => {
          if (!client || !deleteId) return;
          try {
            const session = await client.session(deleteId);
            await session.delete();
            toast.success(`Deleted ${deleteId}`);
            setDeleteId(null);
            await load();
          } catch (err) {
            toast.error("Delete failed", { description: formatError(err) });
          }
        }}
      />

      {loading ? <LoadingBlock /> : null}
      {error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : null}

      {!loading && !error && sessions.length === 0 ? (
        <EmptyState
          title="No sessions yet"
          description="Create a session to start recording messages."
          action={
            <Button size="sm" onClick={openCreate}>
              <PlusIcon data-icon="inline-start" />
              Create session
            </Button>
          }
        />
      ) : null}

      {!loading && !error && sessions.length > 0 ? (
        <>
          <TableFrame>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session ID</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-40 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow
                    key={session.id}
                    className="cursor-pointer"
                    onClick={() =>
                      navigate(`/sessions/${encodeURIComponent(session.id)}`)
                    }
                  >
                    <TableCell className="font-mono text-sm">
                      {session.id}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-tabular">
                      {session.createdAt
                        ? new Date(session.createdAt).toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {session.isActive === undefined ? (
                        "-"
                      ) : session.isActive ? (
                        <Badge variant="secondary">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="flex justify-end gap-1">
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
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Delete session ${session.id}`}
                          title="Delete session"
                          onClick={() => setDeleteId(session.id)}
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
