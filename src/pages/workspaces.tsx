import { PlusIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/crud/confirm-delete-dialog";
import { CreateEntityDialog } from "@/components/crud/create-entity-dialog";
import { JsonEditor } from "@/components/crud/json-editor";
import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
} from "@/components/page-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export function WorkspacesPage() {
  const { client, settings, switchWorkspace } = useHoncho();
  const [workspaces, setWorkspaces] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<Record<string, unknown> | null>(
    null,
  );
  const [configuration, setConfiguration] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newWorkspaceId, setNewWorkspaceId] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    setError(null);
    try {
      const page = await client.workspaces({ page: 1, size: 100 });
      setWorkspaces(page.items);
      const [meta, config] = await Promise.all([
        client.getMetadata(),
        client.getConfiguration(),
      ]);
      setMetadata(meta);
      setConfiguration(config);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSwitchWorkspace(workspaceId: string) {
    if (workspaceId === settings.workspaceId) return;
    setSwitching(workspaceId);
    const err = await switchWorkspace(workspaceId);
    setSwitching(null);
    if (err) {
      toast.error("Failed to switch workspace", { description: err });
      return;
    }
    toast.success(`Switched to ${workspaceId}`);
    await load();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Workspaces"
        description="List accessible workspaces and manage the active workspace."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCwIcon data-icon="inline-start" />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setNewWorkspaceId("");
                setCreateOpen(true);
              }}
            >
              <PlusIcon data-icon="inline-start" />
              Create / open
            </Button>
          </div>
        }
      />

      <CreateEntityDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create or open workspace"
        description="Switch to a workspace ID. Honcho get-or-creates it on first use."
        submitLabel="Use workspace"
        onSubmit={async () => {
          const id = newWorkspaceId.trim();
          if (!id) return "Workspace ID is required.";
          const err = await switchWorkspace(id);
          if (err) return err;
          toast.success(`Using workspace ${id}`);
          return null;
        }}
        onSuccess={() => void load()}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="new-workspace">Workspace ID</FieldLabel>
            <Input
              id="new-workspace"
              value={newWorkspaceId}
              onChange={(event) => setNewWorkspaceId(event.target.value)}
              className="font-mono"
              placeholder="my-app"
            />
            <FieldDescription>
              Creates the workspace when you first write peers or sessions to
              it.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </CreateEntityDialog>

      <ConfirmDeleteDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title="Delete workspace"
        description={`Permanently delete workspace ${deleteId} and ALL of its peers, sessions, and messages? This cannot be undone.`}
        onConfirm={async () => {
          if (!client || !deleteId) return;
          try {
            await client.deleteWorkspace(deleteId);
            toast.success(`Deleted ${deleteId}`);
            if (deleteId === settings.workspaceId) {
              toast.message(
                "Switch to another workspace to continue browsing.",
              );
            }
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

      {!loading && !error ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Accessible workspaces</CardTitle>
              <CardDescription>
                Active workspace:{" "}
                <Badge variant="secondary">{settings.workspaceId}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {workspaces.length === 0 ? (
                <EmptyState
                  title="No workspaces found"
                  description="Create or open a workspace ID to get started."
                  action={
                    <Button
                      size="sm"
                      onClick={() => {
                        setNewWorkspaceId("");
                        setCreateOpen(true);
                      }}
                    >
                      <PlusIcon data-icon="inline-start" />
                      Create / open
                    </Button>
                  }
                />
              ) : (
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Workspace ID</TableHead>
                        <TableHead className="w-32">Status</TableHead>
                        <TableHead className="w-48 text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workspaces.map((id) => (
                        <TableRow key={id}>
                          <TableCell className="font-mono text-sm">
                            {id}
                          </TableCell>
                          <TableCell>
                            {id === settings.workspaceId ? (
                              <Badge>Active</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={
                                  id === settings.workspaceId ||
                                  switching === id
                                }
                                onClick={() => void handleSwitchWorkspace(id)}
                              >
                                {switching === id ? "Switching..." : "Use"}
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                aria-label={`Delete workspace ${id}`}
                                title="Delete workspace"
                                onClick={() => setDeleteId(id)}
                              >
                                <Trash2Icon />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Active metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <JsonEditor
                  label="Metadata JSON"
                  value={metadata ?? {}}
                  onSave={async (parsed) => {
                    if (!client) return;
                    await client.setMetadata(parsed as Record<string, unknown>);
                    setMetadata(parsed as Record<string, unknown>);
                    toast.success("Workspace metadata saved");
                  }}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Active configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <JsonEditor
                  label="Configuration JSON"
                  value={configuration ?? {}}
                  onSave={async (parsed) => {
                    if (!client) return;
                    await client.setConfiguration(
                      parsed as Parameters<
                        NonNullable<typeof client>["setConfiguration"]
                      >[0],
                    );
                    setConfiguration(parsed);
                    toast.success("Workspace configuration saved");
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
