// @honcho-ai/sdk falls back to process.env; Tauri/browser has no Node process.
const g = globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
};

if (typeof g.process === "undefined") {
  Object.defineProperty(g, "process", {
    value: { env: {} },
    writable: true,
    configurable: true,
  });
} else if (!g.process.env) {
  g.process.env = {};
}
