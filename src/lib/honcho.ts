import { Honcho } from "@honcho-ai/sdk";

import { type ConnectionSettings, resolveBaseUrl } from "@/lib/settings";

/** Settings needed to reach an instance (workspace optional until picked). */
export type InstanceSettings = Pick<
  ConnectionSettings,
  "mode" | "baseUrl" | "apiKey"
> & {
  workspaceId?: string;
};

export function createHonchoClient(
  settings: InstanceSettings & { workspaceId?: string },
): Honcho {
  const apiKey = settings.apiKey.trim();
  const workspaceId = settings.workspaceId?.trim() || "default";
  const baseURL = resolveBaseUrl(settings);

  // Always pass explicit values. The SDK falls back to `process.env` (missing in
  // the webview) when apiKey/baseURL/workspaceId are omitted. Also avoid
  // `environment: "local"`, which forces http://localhost:8000 and ignores baseURL.
  return new Honcho({
    apiKey: apiKey || undefined,
    workspaceId,
    baseURL,
    environment: settings.mode === "cloud" ? "production" : undefined,
  });
}

export async function listWorkspaces(
  settings: InstanceSettings,
): Promise<{ ok: true; workspaces: string[] } | { ok: false; error: string }> {
  try {
    const client = createHonchoClient(settings);
    const page = await client.workspaces({ page: 1, size: 100 });
    return { ok: true, workspaces: page.items };
  } catch (error) {
    return {
      ok: false,
      error: formatConnectionError(error, resolveBaseUrl(settings)),
    };
  }
}

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function formatConnectionError(error: unknown, baseUrl: string): string {
  const message = formatError(error);
  const lower = message.toLowerCase();

  if (
    lower.includes("load failed") ||
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("connection")
  ) {
    return `Could not reach ${baseUrl}. Check the URL, that the server is running, and your network/API key. (${message})`;
  }

  return message;
}
