# Security Policy

## Supported versions

Security fixes are applied to the latest commit on `main` and to the most recent tagged release when tags exist.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Prefer one of:

1. [GitHub Security Advisories](https://github.com/vincentzhangz/honcho-explorer/security/advisories/new) (private disclosure), or
2. Email the maintainer at **vincentzhangz@outlook.com** with a description of the issue, impact, and steps to reproduce if possible.

You should receive an acknowledgment within a few days. We will work with you on a fix and coordinated disclosure when appropriate.

## Scope notes

Honcho Explorer stores connection settings (including optional API keys) locally via the Tauri store on the user’s machine. Reports involving local secret handling, dependency CVEs affecting the app, or unsafe IPC / network behavior are in scope.
