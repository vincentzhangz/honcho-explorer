export const CLOUD_BASE_URL = "https://api.honcho.dev";
export const DEFAULT_SELF_HOSTED_URL = "http://localhost:8000";

export type ConnectionMode = "cloud" | "self-hosted";

export type ConnectionSettings = {
  mode: ConnectionMode;
  baseUrl: string;
  apiKey: string;
  workspaceId: string;
  connected: boolean;
};

export const defaultSettings = (): ConnectionSettings => ({
  mode: "cloud",
  baseUrl: CLOUD_BASE_URL,
  apiKey: "",
  workspaceId: "",
  connected: false,
});

export function resolveBaseUrl(
  settings: Pick<ConnectionSettings, "mode" | "baseUrl">,
): string {
  if (settings.mode === "cloud") {
    return CLOUD_BASE_URL;
  }
  return settings.baseUrl.trim().replace(/\/$/, "") || DEFAULT_SELF_HOSTED_URL;
}

export function resolveEnvironment(
  settings: Pick<ConnectionSettings, "mode">,
): "production" | "local" {
  return settings.mode === "cloud" ? "production" : "local";
}

const STORE_PATH = "settings.json";
const SETTINGS_KEY = "connection";
const LOCAL_FALLBACK_KEY = "honcho-explorer:connection";

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function getStore() {
  const { LazyStore } = await import("@tauri-apps/plugin-store");
  return new LazyStore(STORE_PATH);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("store timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export async function loadSettings(): Promise<ConnectionSettings> {
  const fallback = defaultSettings();

  try {
    if (isTauri()) {
      const store = await withTimeout(getStore(), 3000);
      const saved = await withTimeout(
        store.get<ConnectionSettings>(SETTINGS_KEY),
        3000,
      );
      if (saved) {
        return { ...fallback, ...saved };
      }
      return fallback;
    }

    const raw = localStorage.getItem(LOCAL_FALLBACK_KEY);
    if (raw) {
      return { ...fallback, ...JSON.parse(raw) };
    }
  } catch (error) {
    console.error("Failed to load settings", error);
  }

  return fallback;
}

export async function saveSettings(
  settings: ConnectionSettings,
): Promise<void> {
  const normalized: ConnectionSettings = {
    ...settings,
    baseUrl: resolveBaseUrl(settings),
    apiKey: settings.apiKey.trim(),
    workspaceId: settings.workspaceId.trim(),
  };

  try {
    if (isTauri()) {
      const store = await withTimeout(getStore(), 3000);
      await withTimeout(store.set(SETTINGS_KEY, normalized), 3000);
      await withTimeout(store.save(), 3000);
      return;
    }
  } catch (error) {
    console.error("Failed to save settings to Tauri store", error);
  }

  localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(normalized));
}
