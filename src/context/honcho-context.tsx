import type { Honcho } from "@honcho-ai/sdk";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createHonchoClient,
  type InstanceSettings,
  listWorkspaces,
} from "@/lib/honcho";
import {
  type ConnectionSettings,
  defaultSettings,
  loadSettings,
  saveSettings,
} from "@/lib/settings";

type ProbeResult =
  | { ok: true; workspaces: string[]; draft: ConnectionSettings }
  | { ok: false; error: string };

type HonchoContextValue = {
  settings: ConnectionSettings;
  client: Honcho | null;
  loading: boolean;
  ready: boolean;
  updateSettings: (next: ConnectionSettings) => Promise<void>;
  /** Probe instance (URL + API key); does not mark explorer ready. */
  probeInstance: (instance: InstanceSettings) => Promise<ProbeResult>;
  /** Persist connection with a chosen workspace and open the explorer. */
  selectWorkspace: (
    draft: ConnectionSettings,
    workspaceId: string,
  ) => Promise<string | null>;
  /** Switch active workspace while already connected to the same instance. */
  switchWorkspace: (workspaceId: string) => Promise<string | null>;
  disconnect: () => Promise<void>;
};

const HonchoContext = createContext<HonchoContextValue | null>(null);

export function HonchoProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ConnectionSettings>(defaultSettings);
  const [client, setClient] = useState<Honcho | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const saved = await loadSettings();
        if (cancelled) return;

        setSettings(saved);
        if (saved.connected && saved.workspaceId.trim()) {
          setClient(createHonchoClient(saved));
        }
      } catch (error) {
        console.error("Failed to initialize Honcho settings", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateSettings = useCallback(async (next: ConnectionSettings) => {
    await saveSettings(next);
    setSettings(next);
    if (next.connected && next.workspaceId.trim()) {
      setClient(createHonchoClient(next));
    } else {
      setClient(null);
    }
  }, []);

  const probeInstance = useCallback(
    async (instance: InstanceSettings): Promise<ProbeResult> => {
      const draft: ConnectionSettings = {
        mode: instance.mode,
        baseUrl: instance.baseUrl,
        apiKey: instance.apiKey.trim(),
        workspaceId: "",
        connected: false,
      };

      const result = await listWorkspaces(draft);
      if (!result.ok) {
        return { ok: false, error: result.error };
      }

      return { ok: true, workspaces: result.workspaces, draft };
    },
    [],
  );

  const selectWorkspace = useCallback(
    async (draft: ConnectionSettings, workspaceId: string) => {
      const id = workspaceId.trim();
      if (!id) {
        return "Workspace ID is required.";
      }

      const connected: ConnectionSettings = {
        ...draft,
        workspaceId: id,
        connected: true,
      };

      try {
        // Smoke-check the chosen workspace by constructing a client scoped to it.
        createHonchoClient(connected);
        await saveSettings(connected);
        setSettings(connected);
        setClient(createHonchoClient(connected));
        return null;
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    },
    [],
  );

  const switchWorkspace = useCallback(
    async (workspaceId: string) => {
      const id = workspaceId.trim();
      if (!id) {
        return "Workspace ID is required.";
      }
      if (id === settings.workspaceId) {
        return null;
      }

      const next: ConnectionSettings = {
        ...settings,
        workspaceId: id,
        connected: true,
      };

      try {
        await saveSettings(next);
        setSettings(next);
        setClient(createHonchoClient(next));
        return null;
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    },
    [settings],
  );

  const disconnect = useCallback(async () => {
    const next: ConnectionSettings = { ...settings, connected: false };
    await saveSettings(next);
    setSettings(next);
    setClient(null);
  }, [settings]);

  const value = useMemo<HonchoContextValue>(
    () => ({
      settings,
      client,
      loading,
      ready: Boolean(
        client && settings.connected && settings.workspaceId.trim(),
      ),
      updateSettings,
      probeInstance,
      selectWorkspace,
      switchWorkspace,
      disconnect,
    }),
    [
      settings,
      client,
      loading,
      updateSettings,
      probeInstance,
      selectWorkspace,
      switchWorkspace,
      disconnect,
    ],
  );

  return (
    <HonchoContext.Provider value={value}>{children}</HonchoContext.Provider>
  );
}

export function useHoncho() {
  const context = useContext(HonchoContext);
  if (!context) {
    throw new Error("useHoncho must be used within HonchoProvider");
  }
  return context;
}
