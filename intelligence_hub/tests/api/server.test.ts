import assert from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { handleApiRequest } from "../../src/api/server.js";
import { parseAppConfig } from "../../src/config/app-config.js";
import { IntelligenceHub } from "../../src/core/intelligence-hub.js";
import { IntelligenceDatabase } from "../../src/storage/database.js";

test("ingress root describes the available Intelligence Hub endpoints", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ih-api-"));
  const db = new IntelligenceDatabase(join(dir, "test.db"));
  db.initialize();
  const hub = new IntelligenceHub(parseAppConfig({ news_feeds: [], market_symbols: [] }), db);

  try {
    const response = await handleApiRequest(hub, "GET", "/");
    assert.equal(response.status, 200);
    assert.deepEqual(response.data, {
      name: "Intelligence Hub",
      version: "0.1.8",
      endpoints: [
        "GET /health",
        "GET /api/news",
        "GET /api/markets",
        "GET /api/watches",
        "POST /api/sync/news",
        "POST /api/sync/markets"
      ]
    });
  } finally {
    db.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test("health exposes collector readiness instead of an unconditional ok", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ih-api-"));
  const db = new IntelligenceDatabase(join(dir, "test.db"));
  db.initialize();
  const hub = new IntelligenceHub(parseAppConfig({ news_feeds: [], market_symbols: [] }), db);

  try {
    const response = await handleApiRequest(hub, "GET", "/health");
    assert.equal(response.status, 200);
    assert.deepEqual(response.data, {
      status: "starting",
      collectors: {
        news: { status: "idle", errors: [] },
        markets: { status: "disabled", errors: [] }
      }
    });
  } finally {
    db.close();
    await rm(dir, { recursive: true, force: true });
  }
});
