/**
 * Route absolute http(s) requests through Tauri's HTTP plugin so Honcho API
 * calls are not blocked by WebView CORS. Keep the browser fetch for relative
 * Vite/module URLs — replacing those hangs app startup (dynamic imports).
 */
export async function installTauriFetch(): Promise<void> {
  const isTauri =
    typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
  if (!isTauri) {
    return;
  }

  const { fetch: tauriFetch } = await import("@tauri-apps/plugin-http");
  const browserFetch = window.fetch.bind(window);

  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    if (url.startsWith("http://") || url.startsWith("https://")) {
      return tauriFetch(input, init);
    }

    return browserFetch(input, init);
  }) as typeof fetch;
}
