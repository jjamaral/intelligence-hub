# Intelligence Hub Design

## Goal
Run a local Home Assistant App on Home Assistant OS that collects and scores FC Porto and AI news, monitors selected market instruments, persists state, and sends configurable Home Assistant notifications.

## V0.1 scope
- Node.js + TypeScript backend in one Git repository.
- Home Assistant App packaging for `amd64` and `aarch64`.
- FC Porto news via configurable RSS feeds, with Google News RSS defaults.
- AI news via configurable RSS feeds, with official/vendor-focused defaults where RSS is available and Google News topic queries as fallback.
- Market watchlist: S&P 500 proxy (`SPY` by default), Tesla (`TSLA`), Uber (`UBER`), SpaceX (`SPCX`).
- Twelve Data-compatible market provider behind an interface; market collection is disabled cleanly when no API key is configured.
- Deterministic topic classification, relevance scoring, deduplication, quiet hours, and alert rules.
- SQLite persistence in `/data/intelligence-hub.db`.
- Home Assistant Core communication through `http://supervisor/core/api` and `SUPERVISOR_TOKEN`.
- Aggregate Home Assistant sensor states and Companion App notifications.
- HTTP endpoints for health, news, markets, watches, and manual collection.

## Architecture
A single long-running Node process owns collection, processing, persistence, scheduling, Home Assistant publication, and the local HTTP API. External providers are isolated behind small interfaces. Home Assistant is an integration surface, not the source of truth.

## Domain boundaries
- `news`: feed collection, normalization, classification, scoring, deduplication.
- `market`: quotes and movement events behind a provider contract.
- `storage`: SQLite schema and repositories.
- `ha`: Home Assistant REST client, sensors, notifications.
- `core`: orchestration, alert policy, quiet hours, scheduler.
- `api`: read-only/control HTTP endpoints.

## Constraints
- No `any`. TypeScript `strict`, `noImplicitAny`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes` enabled.
- No paid AI dependency in V0.1.
- No automated investment recommendations or trading.
- Provider failures must be isolated; one failed source must not stop the process.
- Secrets never committed; options/API keys are read from Home Assistant `/data/options.json` or environment variables.
- Persistent data stays under `/data` so Home Assistant backups include it.
- Home Assistant API access uses `homeassistant_api: true` and `SUPERVISOR_TOKEN`.
- V0.1 uses standard HA states/notifications; no custom Lovelace card or custom integration.

## Success criteria
1. App starts on HA OS and survives restart without losing data.
2. `/health` reports ready state and collector status.
3. FC Porto and AI feeds collect into SQLite and duplicate stories are collapsed.
4. Relevance rules create alerts only above configured thresholds.
5. Market quotes are collected when a provider key is configured and disabled without crashing otherwise.
6. HA sensors are refreshed after collections.
7. Alerts respect quiet hours and notify the configured HA notify service.
8. Typecheck, tests, and build are green in CI.
