import assert from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { parseAppConfig } from "../../src/config/app-config.js";
import { IntelligenceHub } from "../../src/core/intelligence-hub.js";
import { IntelligenceDatabase } from "../../src/storage/database.js";
import { HomeAssistantClient } from "../../src/ha/client.js";

test("news health reports a degraded collection while preserving successful feeds", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ih-health-"));
  const db = new IntelligenceDatabase(join(dir, "test.db"));
  db.initialize();
  const config = parseAppConfig({
    database_path: join(dir, "test.db"),
    news_feeds: [
      { id: "good", topic: "fc_porto", url: "https://example.com/good", source: "Good" },
      { id: "bad", topic: "ai", url: "https://example.com/bad", source: "Bad" }
    ],
    market_symbols: []
  });
  const fetcher = async (input: RequestInfo | URL): Promise<Response> => {
    if (String(input).endsWith("/bad")) return new Response("failure", { status: 503 });
    return new Response("<rss><channel><item><title>FC Porto confirma reforço</title><link>https://example.com/item</link><description>Oficial</description><pubDate>Sun, 30 Aug 2026 12:00:00 GMT</pubDate></item></channel></rss>");
  };

  try {
    const hub = new IntelligenceHub(config, db, undefined, fetcher);
    const result = await hub.collectNews();

    assert.equal(result.inserted, 1);
    assert.equal(hub.health.collectors.news.status, "degraded");
    assert.equal(hub.health.collectors.news.errors.length, 1);
    assert.equal(hub.health.collectors.markets.status, "disabled");
  } finally {
    db.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test("Home Assistant publication failure degrades health without rejecting collection", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ih-health-"));
  const db = new IntelligenceDatabase(join(dir, "test.db"));
  db.initialize();
  const config = parseAppConfig({ news_feeds: [], market_symbols: [] });
  const unavailable = async (): Promise<Response> => new Response("unavailable", { status: 503 });
  const hub = new IntelligenceHub(config, db, new HomeAssistantClient("token", unavailable));

  try {
    const result = await hub.collectNews();
    assert.equal(result.inserted, 0);
    assert.equal(result.errors.length, 1);
    assert.ok(result.errors[0]?.startsWith("home_assistant:"));
    assert.equal(hub.health.status, "degraded");
  } finally {
    db.close();
    await rm(dir, { recursive: true, force: true });
  }
});
