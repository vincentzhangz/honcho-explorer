# Contributing to Honcho Explorer

Thanks for your interest in contributing. This document covers setup and expectations for pull requests.

## Development setup

1. Install [Bun](https://bun.sh/), [Rust](https://www.rust-lang.org/tools/install), and [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/).
2. Clone the repo and install JS dependencies:

   ```bash
   bun install
   ```

3. Run the desktop app:

   ```bash
   bunx tauri dev
   ```

## Before you open a PR

Frontend:

```bash
bun run lint
bun run typecheck
bun run build
```

To auto-fix format and safe lint issues:

```bash
bun run lint:fix
```

Rust (`src-tauri`):

```bash
cd src-tauri
cargo fmt --check
cargo clippy -- -D warnings
cargo check
```

CI runs the same checks on every pull request to `main`.

## Pull requests

- Keep changes focused; prefer small PRs over large mixed ones.
- Describe **why** the change is needed and how you tested it.
- Do not commit secrets, API keys, `.env` files, or local IDE config under `.cursor/`.
- Match existing TypeScript / React patterns and the app’s enterprise UI conventions.

## Issues

Use the GitHub issue templates for bugs and feature requests. Include OS, app version (or commit), and steps to reproduce when reporting bugs.

## Code of conduct

By participating, you agree to uphold our [Code of Conduct](CODE_OF_CONDUCT.md).
