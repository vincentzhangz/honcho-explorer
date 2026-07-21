# Honcho Explorer

Desktop explorer for [Honcho](https://github.com/plastic-labs/honcho) memory. Browse workspaces, peers, sessions, messages, representations, context, and search from a native app.

[![CI](https://github.com/vincentzhangz/honcho-explorer/actions/workflows/ci.yml/badge.svg)](https://github.com/vincentzhangz/honcho-explorer/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Features

- Connect to **Honcho Cloud** or a **self-hosted** instance
- Browse and switch workspaces; manage peers and sessions
- Inspect messages, memory, context, and run semantic search
- Light / dark / system theme; settings stored only on your machine

## Stack

- Tauri 2 + React 19 + Vite 7
- shadcn Base UI + Tailwind CSS 4
- [Biome](https://biomejs.dev/) for format and lint
- `@honcho-ai/sdk`
- Bun

## Prerequisites

- [Bun](https://bun.sh/)
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- Platform dependencies for Tauri 2: see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

## Develop

```bash
bun install
bunx tauri dev
```

Frontend only (no native shell):

```bash
bun run dev
```

Format and lint with Biome:

```bash
bun run lint
bun run lint:fix
```

## Build

```bash
# Typecheck + Vite production build
bun run typecheck
bun run build

# Full desktop app bundle
bunx tauri build
```

## Connect

On first launch, choose **Honcho Cloud** (`https://api.honcho.dev`) or **Self-hosted** (custom base URL), optionally set an API key, and pick a workspace.

Connection settings are saved locally via the Tauri store (app data directory). They are not uploaded by this app. On macOS that path is typically:

`~/Library/Application Support/com.vincentzhangz.honcho-explorer/`

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Please follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

See [SECURITY.md](SECURITY.md) for how to report vulnerabilities.

## License

[MIT](LICENSE)
