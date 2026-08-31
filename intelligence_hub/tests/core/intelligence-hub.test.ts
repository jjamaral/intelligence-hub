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
    assert.equal(result.errors.length, 2);
    assert.ok(result.errors[0]?.startsWith("home_assistant:"));
    assert.ok(result.errors[1]?.startsWith("home_assistant_health:"));
    assert.equal(hub.health.status, "degraded");
  } finally {
    db.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test("market notifications fire once when movement crosses the configured threshold", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ih-market-alert-"));
  const db = new IntelligenceDatabase(join(dir, "test.db"));
  db.initialize();
  const changes = [2, 3.5, 4];
  const marketFetch = async (): Promise<Response> => {
    const change = changes.shift();
    return new Response(JSON.stringify({ close: "412.50", percent_change: String(change), currency: "USD" }), { status: 200 });
  };
  const notifications: unknown[] = [];
  const haFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (String(input).includes("/services/notify/")) notifications.push(JSON.parse(String(init?.body)) as unknown);
    return new Response("{}", { status: 200 });
  };
  const config = parseAppConfig({
    news_feeds: [],
    market_symbols: ["TSLA"],
    twelve_data_api_key: "key",
    notify_service: "mobile_app_phone",
    market_alert_percent: 3,
    quiet_start: "00:00",
    quiet_end: "00:00"
  });
  const hub = new IntelligenceHub(config, db, new HomeAssistantClient("token", haFetch), marketFetch);

  try {
    await hub.collectMarkets();
    assert.equal(notifications.length, 0);

    await hub.collectMarkets();
    assert.deepEqual(notifications, [{
      title: "TSLA price alert",
      message: "TSLA is up 3.50% at 412.5 USD.",
      data: {}
    }]);

    await hub.collectMarkets();
    assert.equal(notifications.length, 1);
  } finally {
    db.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test("failed market notifications remain pending and retry without another threshold crossing", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ih-market-alert-retry-"));
  const db = new IntelligenceDatabase(join(dir, "test.db"));
  db.initialize();
  const changes = [3.5, 4];
  const marketFetch = async (): Promise<Response> => new Response(JSON.stringify({
    close: "412.50",
    percent_change: String(changes.shift()),
    currency: "USD"
  }), { status: 200 });
  let notificationAttempts = 0;
  const haFetch = async (input: RequestInfo | URL): Promise<Response> => {
    if (String(input).includes("/services/notify/")) {
      notificationAttempts++;
      return new Response("notify unavailable", { status: notificationAttempts === 1 ? 503 : 200 });
    }
    return new Response("{}", { status: 200 });
  };
  const hub = new IntelligenceHub(parseAppConfig({
    news_feeds: [], market_symbols: ["TSLA"], twelve_data_api_key: "key", notify_service: "phone",
    market_alert_percent: 3, quiet_start: "00:00", quiet_end: "00:00"
  }), db, new HomeAssistantClient("token", haFetch), marketFetch);

  try {
    const failed = await hub.collectMarkets();
    assert.equal(notificationAttempts, 1);
    assert.equal(failed.errors.length, 1);
    assert.equal(db.listPendingMarketAlerts().length, 1);

    const retried = await hub.collectMarkets();
    assert.equal(notificationAttempts, 2);
    assert.deepEqual(retried.errors, []);
    assert.deepEqual(db.listPendingMarketAlerts(), []);
  } finally {
    db.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test("collection publishes the final collector health after status settles", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ih-health-publish-"));
  const db = new IntelligenceDatabase(join(dir, "test.db"));
  db.initialize();
  const statusPayloads: unknown[] = [];
  const haFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (String(input).endsWith("/states/sensor.intelligence_hub_status")) {
      statusPayloads.push(JSON.parse(String(init?.body)) as unknown);
    }
    return new Response("{}", { status: 200 });
  };
  const hub = new IntelligenceHub(
    parseAppConfig({ news_feeds: [], market_symbols: [] }),
    db,
    new HomeAssistantClient("token", haFetch)
  );

  try {
    await hub.collectNews();
    assert.equal(statusPayloads.length, 1);
    const payload = statusPayloads[0] as { state: string; attributes: Record<string, unknown> };
    assert.equal(payload.state, "ready");
    assert.equal(payload.attributes["news_status"], "ok");
    assert.deepEqual(payload.attributes["news_errors"], []);
    assert.ok(/^2026-|^20\d\d-/.test(String(payload.attributes["news_last_attempt_at"])));
    assert.ok(/^2026-|^20\d\d-/.test(String(payload.attributes["news_last_success_at"])));
    assert.equal(payload.attributes["markets_status"], "disabled");
    assert.deepEqual(payload.attributes["markets_errors"], []);
  } finally {
    db.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test("concurrent market collections share one provider request and one alert", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ih-market-concurrent-"));
  const db = new IntelligenceDatabase(join(dir, "test.db"));
  db.initialize();
  let marketRequests = 0;
  const quoteResolvers: ((response: Response) => void)[] = [];
  const marketFetch = async (): Promise<Response> => {
    marketRequests++;
    return new Promise<Response>((resolve) => { quoteResolvers.push(resolve); });
  };
  let notifications = 0;
  const haFetch = async (input: RequestInfo | URL): Promise<Response> => {
    if (String(input).includes("/services/notify/")) notifications++;
    return new Response("{}", { status: 200 });
  };
  const hub = new IntelligenceHub(parseAppConfig({
    news_feeds: [], market_symbols: ["TSLA"], twelve_data_api_key: "key", notify_service: "phone",
    market_alert_percent: 3, quiet_start: "00:00", quiet_end: "00:00"
  }), db, new HomeAssistantClient("token", haFetch), marketFetch);

  try {
    const first = hub.collectMarkets();
    const second = hub.collectMarkets();
    for (const resolve of quoteResolvers) {
      resolve(new Response(JSON.stringify({ close: "412.50", percent_change: "3.5", currency: "USD" }), { status: 200 }));
    }
    await Promise.all([first, second]);
    assert.equal(marketRequests, 1);
    assert.equal(notifications, 1);
  } finally {
    db.close();
    await rm(dir, { recursive: true, force: true });
  }
});
