# Intelligence Hub Initial MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an installable Home Assistant App that collects FC Porto/AI news, tracks configured market symbols, persists data, publishes HA sensors, and sends rule-based alerts.

**Architecture:** One Node.js/TypeScript process uses isolated provider, storage, Home Assistant, and orchestration modules. SQLite under `/data` is the source of truth; Home Assistant is updated through the Supervisor Core API proxy.

**Tech Stack:** Node.js 22+, TypeScript 5.8+, Node test runner, native fetch, `node:sqlite`, Home Assistant App container.

**Spec:** `docs/superpowers/specs/2026-08-30-intelligence-hub-design.md`

## Global Constraints
- No `any`.
- TypeScript strict mode plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
- External source failures are isolated.
- AI is not required for V0.1.
- All persistent runtime data is stored under `/data`.
- Home Assistant API calls use `SUPERVISOR_TOKEN`; no long-lived token is required in HA OS.

---

### Task 1: Repository foundation
**Files:** `package.json`, `tsconfig.json`, `.gitignore`, `.editorconfig`, `README.md`
**Produces:** repeatable `typecheck`, `test`, and `build` commands.
- [ ] Add strict TypeScript configuration and scripts.
- [ ] Add repository documentation and local-development instructions.
- [ ] Verify TypeScript can compile a minimal entrypoint.

### Task 2: Typed configuration and domain contracts
**Files:** `src/config/*`, `src/domain/*`, `tests/core/config.test.ts`
**Produces:** `AppConfig`, `Watch`, `NewsItem`, `MarketQuote`, `Alert`, parser/validation helpers.
- [ ] Write configuration tests for defaults and invalid values.
- [ ] Implement zero-`any` runtime parsing of `/data/options.json` and environment overrides.
- [ ] Verify config tests and typecheck.

### Task 3: SQLite persistence
**Files:** `src/storage/*`, `tests/storage/database.test.ts`
**Produces:** `Database` with schema initialization, news/market/alert repositories.
- [ ] Write failing persistence/dedup tests.
- [ ] Implement schema and repository methods with parameterized SQL.
- [ ] Verify restart-safe persistence in a temporary database.

### Task 4: News vertical slice
**Files:** `src/news/*`, `tests/news/*`
**Produces:** RSS parser, HTTP feed collector, classifier, scorer, deterministic dedup key.
- [ ] Test RSS normalization against fixtures.
- [ ] Test FC Porto and AI classification/relevance behavior.
- [ ] Test duplicate detection.
- [ ] Implement collectors and processor with per-source failure isolation.

### Task 5: Home Assistant client and alerts
**Files:** `src/ha/*`, `src/core/alert-policy.ts`, `tests/ha/*`, `tests/core/alert-policy.test.ts`
**Produces:** HA state publisher, notify service client, quiet-hours policy.
- [ ] Test API request shapes with an injected fetch implementation.
- [ ] Test quiet-hours and threshold behavior.
- [ ] Implement alert delivery and sensor publication.

### Task 6: Market provider
**Files:** `src/market/*`, `tests/market/*`
**Produces:** typed provider contract and Twelve Data adapter.
- [ ] Test provider response decoding without unsafe casts.
- [ ] Test provider-disabled behavior when API key is absent.
- [ ] Implement quote storage and movement detection.

### Task 7: Orchestration and API
**Files:** `src/core/intelligence-hub.ts`, `src/core/scheduler.ts`, `src/api/server.ts`, `src/index.ts`, `tests/core/intelligence-hub.test.ts`
**Produces:** startup, periodic collection, `/health`, `/api/news`, `/api/markets`, `/api/watches`, manual sync endpoint.
- [ ] Test an end-to-end news collection with injected fake fetch/HA client.
- [ ] Implement orchestrator and scheduler.
- [ ] Implement HTTP API with typed JSON helpers and defensive error handling.

### Task 8: Home Assistant App packaging
**Files:** `intelligence_hub/config.yaml`, `intelligence_hub/Dockerfile`, `intelligence_hub/run.sh`, `intelligence_hub/DOCS.md`, `repository.yaml`
**Produces:** installable HA App repository layout.
- [ ] Add HA options/schema, `homeassistant_api: true`, persistence, ports, and app metadata.
- [ ] Add multi-arch-aware Dockerfile and startup script.
- [ ] Document repository installation and notification target configuration.

### Task 9: CI and release hygiene
**Files:** `.github/workflows/ci.yml`, `.github/workflows/release.yml`, `CHANGELOG.md`
**Produces:** CI typecheck/test/build and tagged release image workflow skeleton.
- [ ] Add CI for Node 22.
- [ ] Add release workflow designed for GHCR and Home Assistant version tags.
- [ ] Verify YAML syntax statically where tooling allows.

### Task 10: Final verification
- [ ] Run `tsc --noEmit`.
- [ ] Run complete test suite.
- [ ] Run production build.
- [ ] Search source for explicit `any`, `@ts-ignore`, and unsafe double assertions.
- [ ] Review secrets, HA permissions, persistence paths, and failure isolation.
