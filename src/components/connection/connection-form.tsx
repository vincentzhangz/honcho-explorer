import { ArrowLeftIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useHoncho } from "@/context/honcho-context";
import {
  CLOUD_BASE_URL,
  type ConnectionMode,
  type ConnectionSettings,
  DEFAULT_SELF_HOSTED_URL,
} from "@/lib/settings";
import { cn } from "@/lib/utils";

type ConnectionFormProps = {
  initial: ConnectionSettings;
  instanceSubmitLabel?: string;
  workspaceSubmitLabel?: string;
  onComplete?: () => void;
};

export function ConnectionForm({
  initial,
  instanceSubmitLabel = "Continue",
  workspaceSubmitLabel = "Open explorer",
  onComplete,
}: ConnectionFormProps) {
  const { probeInstance, selectWorkspace } = useHoncho();

  const [step, setStep] = useState<"instance" | "workspace">("instance");
  const [mode, setMode] = useState<ConnectionMode>(initial.mode);
  const [baseUrl, setBaseUrl] = useState(
    initial.mode === "cloud" ? CLOUD_BASE_URL : initial.baseUrl,
  );
  const [apiKey, setApiKey] = useState(initial.apiKey);
  const [draft, setDraft] = useState<ConnectionSettings | null>(null);
  const [workspaces, setWorkspaces] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState(initial.workspaceId);
  const [manualId, setManualId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleProbe(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (mode === "self-hosted" && !baseUrl.trim()) {
      setError("Base URL is required for self-hosted instances.");
      return;
    }

    setPending(true);
    const result = await probeInstance({
      mode,
      baseUrl: mode === "cloud" ? CLOUD_BASE_URL : baseUrl.trim(),
      apiKey: apiKey.trim(),
    });
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      toast.error("Connection failed", { description: result.error });
      return;
    }

    setDraft(result.draft);
    setWorkspaces(result.workspaces);

    const preferred =
      (initial.workspaceId &&
        result.workspaces.includes(initial.workspaceId) &&
        initial.workspaceId) ||
      result.workspaces[0] ||
      "";
    setSelectedId(preferred);
    setManualId(result.workspaces.length === 0 ? initial.workspaceId : "");
    setStep("workspace");
    toast.success(
      result.workspaces.length > 0
        ? `Found ${result.workspaces.length} workspace${result.workspaces.length === 1 ? "" : "s"}`
        : "Connected - enter a workspace ID",
    );
  }

  async function handleSelectWorkspace(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;

    setError(null);
    const workspaceId = (manualId.trim() || selectedId).trim();
    if (!workspaceId) {
      setError("Select a workspace or enter an ID.");
      return;
    }

    setPending(true);
    const err = await selectWorkspace(draft, workspaceId);
    setPending(false);

    if (err) {
      setError(err);
      toast.error("Could not open workspace", { description: err });
      return;
    }

    toast.success(`Connected to ${workspaceId}`);
    onComplete?.();
  }

  if (step === "workspace" && draft) {
    return (
      <form onSubmit={handleSelectWorkspace} className="flex flex-col gap-6">
        <ol className="flex items-center gap-2 text-xs text-muted-foreground">
          <li className="rounded-md px-2 py-1">1. Instance</li>
          <li aria-hidden className="text-border">
            /
          </li>
          <li className="rounded-md bg-muted px-2 py-1 font-medium text-foreground">
            2. Workspace
          </li>
        </ol>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Choose a workspace</p>
          <p className="text-sm text-muted-foreground">
            Connected to{" "}
            <span className="font-mono text-foreground">
              {draft.mode === "cloud" ? CLOUD_BASE_URL : draft.baseUrl}
            </span>
          </p>
        </div>

        {workspaces.length > 0 ? (
          <ScrollArea className="h-56 rounded-lg border">
            <div
              className="flex flex-col p-1"
              role="listbox"
              aria-label="Workspaces"
            >
              {workspaces.map((id) => {
                const selected = selectedId === id && !manualId.trim();
                return (
                  <button
                    key={id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      setSelectedId(id);
                      setManualId("");
                    }}
                    className={cn(
                      "min-h-10 rounded-md px-3 py-2 text-left font-mono text-sm transition-colors",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted",
                    )}
                  >
                    {id}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="rounded-lg border border-dashed p-4">
            <p className="text-sm font-medium">No workspaces found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter a workspace ID below to open or create one on this instance.
            </p>
          </div>
        )}

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="manual-workspace">
              {workspaces.length > 0
                ? "Or enter a workspace ID"
                : "Workspace ID"}
            </FieldLabel>
            <Input
              id="manual-workspace"
              value={manualId}
              onChange={(event) => setManualId(event.target.value)}
              placeholder="my-workspace"
              className="font-mono text-base md:text-sm"
            />
            <FieldDescription>
              Use this if the list is empty or the ID you need is missing.
            </FieldDescription>
          </Field>
        </FieldGroup>

        <div
          className={cn(
            "min-h-5 text-sm text-destructive",
            !error && "invisible",
          )}
          role="alert"
          aria-live="polite"
        >
          {error || "placeholder"}
        </div>

        <div className="flex flex-col gap-2">
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? (
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
            ) : null}
            {pending ? "Opening..." : workspaceSubmitLabel}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => {
              setStep("instance");
              setError(null);
            }}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            Back
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleProbe} className="flex flex-col gap-6">
      <ol className="flex items-center gap-2 text-xs text-muted-foreground">
        <li className="rounded-md bg-muted px-2 py-1 font-medium text-foreground">
          1. Instance
        </li>
        <li aria-hidden className="text-border">
          /
        </li>
        <li className="rounded-md px-2 py-1">2. Workspace</li>
      </ol>
      <FieldGroup>
        <Field>
          <FieldLabel>Instance</FieldLabel>
          <ToggleGroup
            value={[mode]}
            multiple={false}
            onValueChange={(value) => {
              const next = value[0] as ConnectionMode | undefined;
              if (!next) return;
              setMode(next);
              if (next === "cloud") {
                setBaseUrl(CLOUD_BASE_URL);
              } else if (baseUrl === CLOUD_BASE_URL) {
                setBaseUrl(DEFAULT_SELF_HOSTED_URL);
              }
            }}
            variant="outline"
            className="w-full"
          >
            <ToggleGroupItem value="cloud" className="flex-1">
              Honcho Cloud
            </ToggleGroupItem>
            <ToggleGroupItem value="self-hosted" className="flex-1">
              Self-hosted
            </ToggleGroupItem>
          </ToggleGroup>
          <FieldDescription>
            Cloud uses api.honcho.dev. Self-hosted points at your own server.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="base-url">Base URL</FieldLabel>
          <Input
            id="base-url"
            value={mode === "cloud" ? CLOUD_BASE_URL : baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            disabled={mode === "cloud"}
            placeholder={DEFAULT_SELF_HOSTED_URL}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="api-key">API key (optional)</FieldLabel>
          <Input
            id="api-key"
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder={
              mode === "cloud"
                ? "Required for Honcho Cloud"
                : "Leave empty if auth is disabled"
            }
          />
          <FieldDescription>
            Sent as a Bearer token when set. Local instances often need no key.
            After connecting you will pick a workspace from the list.
          </FieldDescription>
        </Field>
      </FieldGroup>

      <div
        className={cn(
          "min-h-5 text-sm text-destructive",
          !error && "invisible",
        )}
        role="alert"
        aria-live="polite"
      >
        {error || "placeholder"}
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? (
          <Loader2Icon data-icon="inline-start" className="animate-spin" />
        ) : null}
        {pending ? "Connecting..." : instanceSubmitLabel}
      </Button>
    </form>
  );
}
