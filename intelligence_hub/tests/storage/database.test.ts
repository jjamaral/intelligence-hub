import assert from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { IntelligenceDatabase } from "../../src/storage/database.js";
import type { Alert, MarketQuote, NewsItem } from "../../src/domain/types.js";

function sampleNews(): NewsItem {
  return { id:"n1", dedupKey:"d1", title:"FC Porto confirma reforço", summary:"Resumo", url:"https://example.com/a", source:"Example", publishedAt:"2026-08-30T10:00:00.000Z", collectedAt:"2026-08-30T10:01:00.000Z", topic:"fc_porto", category:"transfer", relevanceScore:90, confidenceScore:80 };
}

test("database persists news and rejects duplicate dedup keys", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ih-"));
  const path = join(dir, "test.db");
  try {
    const db = new IntelligenceDatabase(path); db.initialize();
    assert.equal(db.insertNews(sampleNews()), true);
    assert.equal(db.insertNews({ ...sampleNews(), id:"n2" }), false);
    assert.equal(db.listNews(10).length, 1);
    db.close();
    const reopened = new IntelligenceDatabase(path); reopened.initialize();
    assert.equal(reopened.listNews(10).length, 1); reopened.close();
  } finally { await rm(dir,{recursive:true,force:true}); }
});

test("database returns the latest quote for threshold comparisons", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ih-"));
  const path = join(dir, "test.db");
  const earlier: MarketQuote = { symbol: "TSLA", price: 400, changePercent: 2, currency: "USD", observedAt: "2026-08-30T10:00:00.000Z" };
  const latest: MarketQuote = { symbol: "TSLA", price: 412, changePercent: 3.5, currency: "USD", observedAt: "2026-08-30T11:00:00.000Z" };
  const db = new IntelligenceDatabase(path);
  try {
    db.initialize();
    assert.equal(db.getLatestMarketQuote("TSLA"), undefined);
    db.insertMarketQuote(earlier);
    db.insertMarketQuote(latest);
    assert.deepEqual(db.getLatestMarketQuote("TSLA"), latest);
  } finally {
    db.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test("database tracks pending market alerts until delivery", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ih-"));
  const path = join(dir, "test.db");
  const alert: Alert = {
    id: "alert-1",
    kind: "market_move",
    title: "TSLA price alert",
    message: "TSLA is up 3.50%.",
    score: 3.5,
    createdAt: "2026-08-30T11:00:00.000Z"
  };
  const db = new IntelligenceDatabase(path);
  try {
    db.initialize();
    db.insertAlert(alert);
    assert.deepEqual(db.listPendingMarketAlerts(), [alert]);

    db.markAlertDelivered(alert.id, "2026-08-30T11:01:00.000Z");
    assert.deepEqual(db.listPendingMarketAlerts(), []);
  } finally {
    db.close();
    await rm(dir, { recursive: true, force: true });
  }
});
