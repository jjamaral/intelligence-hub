import assert from "node:assert/strict";
import { test } from "node:test";
import { parseAppConfig } from "../../src/config/app-config.js";

test("parseAppConfig returns safe defaults", () => {
  const config = parseAppConfig({});

  assert.equal(config.port, 8099);
  assert.equal(config.newsPollMinutes, 15);
  assert.equal(config.marketPollMinutes, 15);
  assert.equal(config.alertThreshold, 75);
  assert.equal(config.quietHours.start, "23:00");
  assert.equal(config.quietHours.end, "07:30");
  assert.deepEqual(config.marketSymbols, ["SPY", "TSLA", "UBER", "SPCX"]);
  assert.ok(config.newsFeeds.length >= 2);
  assert.deepEqual(config.newsFeeds[0], {
    id: "fc-porto-fabrizio-romano",
    topic: "fc_porto",
    source: "Fabrizio Romano",
    url: "https://news.google.com/rss/search?q=%22Fabrizio+Romano%22+%22FC+Porto%22&hl=en-US&gl=US&ceid=US%3Aen",
    priorityBoost: 35
  });
});

test("parseAppConfig accepts Home Assistant options", () => {
  const config = parseAppConfig({
    port: 8100,
    news_poll_minutes: 7,
    market_poll_minutes: 10,
    alert_threshold: 82,
    notify_service: "mobile_app_pixel",
    twelve_data_api_key: "secret",
    quiet_hours: { start: "22:30", end: "08:00" },
    market_symbols: ["SPY", "TSLA"]
  });

  assert.equal(config.port, 8100);
  assert.equal(config.newsPollMinutes, 7);
  assert.equal(config.alertThreshold, 82);
  assert.equal(config.notifyService, "mobile_app_pixel");
  assert.equal(config.twelveDataApiKey, "secret");
  assert.deepEqual(config.marketSymbols, ["SPY", "TSLA"]);
});

test("parseAppConfig rejects values with the wrong runtime type", () => {
  assert.throws(() => parseAppConfig({ alert_threshold: "high" }), /alert_threshold/);
});

test("parseAppConfig validates custom feed priority boosts", () => {
  assert.throws(
    () => parseAppConfig({
      news_feeds: [{ id: "feed", topic: "fc_porto", url: "https://example.com/rss", source: "Example", priority_boost: 101 }]
    }),
    /priority_boost/
  );
});
