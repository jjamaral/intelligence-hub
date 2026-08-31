# Intelligence Hub

A local-first Home Assistant App for curated FC Porto and AI news, market monitoring, and Home Assistant notifications.

## Status

V0.1.7 is under active deployment testing. The backend is Node.js + TypeScript and runs as a Home Assistant App on Home Assistant OS.

## Core principles

- local-first and restart-safe;
- no paid AI dependency for the MVP;
- deterministic scoring before LLMs;
- isolated external providers;
- strict TypeScript with no `any`;
- Home Assistant for states, dashboards, and push notifications.

## Development

Requires Node.js 22.16+ and TypeScript 5.8+.

```bash
npm run typecheck
npm test
npm run build
```

The repository intentionally has no runtime npm dependencies in V0.1: Node's built-in `fetch`, HTTP server, test runner, and SQLite API are used to keep the Home Assistant image small and the attack/dependency surface low.

## Home Assistant

The self-contained Home Assistant App (backend, tests, Docker packaging, and docs) lives in `intelligence_hub/`. Runtime configuration is read from `/data/options.json`, and persistent state is stored in `/data/intelligence-hub.db`.

The app uses Home Assistant's Supervisor Core API proxy with `SUPERVISOR_TOKEN`, so no long-lived access token is required when installed on HA OS.

See `intelligence_hub/DOCS.md` for installation and configuration.
