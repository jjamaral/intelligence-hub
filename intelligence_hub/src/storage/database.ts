import { DatabaseSync } from "node:sqlite";
import type { Alert, AlertKind, MarketQuote, NewsItem, NewsCategory } from "../domain/types.js";

function asString(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  if (typeof value !== "string") throw new Error(`Expected string column ${key}`);
  return value;
}
const NEWS_CATEGORIES = new Set<NewsCategory>(["transfer","injury","match","official","rumour","new_model","api","developer_tool","research","general"]);
function asCategory(row: Record<string, unknown>): NewsCategory { const value=asString(row,"category"); if(!NEWS_CATEGORIES.has(value as NewsCategory)) throw new Error(`Invalid category ${value}`); return value as NewsCategory; }
function asNumber(row: Record<string, unknown>, key: string): number {
  const value = row[key];
  if (typeof value !== "number") throw new Error(`Expected number column ${key}`);
  return value;
}
function marketQuoteFromRow(row: Record<string, unknown>): MarketQuote {
  return {symbol:asString(row,"symbol"),price:asNumber(row,"price"),changePercent:asNumber(row,"change_percent"),currency:asString(row,"currency"),observedAt:asString(row,"observed_at")};
}
const ALERT_KINDS = new Set<AlertKind>(["news", "market_move"]);
function alertFromRow(row: Record<string, unknown>): Alert {
  const kind = asString(row, "kind");
  if (!ALERT_KINDS.has(kind as AlertKind)) throw new Error(`Invalid alert kind ${kind}`);
  const url = row["url"];
  if (url !== null && url !== undefined && typeof url !== "string") throw new Error("Expected nullable string column url");
  return {
    id: asString(row, "id"), kind: kind as AlertKind, title: asString(row, "title"),
    message: asString(row, "message"), score: asNumber(row, "score"), createdAt: asString(row, "created_at"),
    ...(typeof url === "string" ? { url } : {})
  };
}

export class IntelligenceDatabase {
  readonly #db: DatabaseSync;
  constructor(path: string) { this.#db = new DatabaseSync(path); }

  initialize(): void {
    this.#db.exec(`
      PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS news_items (
        id TEXT PRIMARY KEY, dedup_key TEXT NOT NULL UNIQUE, title TEXT NOT NULL, summary TEXT NOT NULL,
        url TEXT NOT NULL, source TEXT NOT NULL, published_at TEXT NOT NULL, collected_at TEXT NOT NULL,
        topic TEXT NOT NULL, category TEXT NOT NULL, relevance_score INTEGER NOT NULL, confidence_score INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS market_quotes (
        symbol TEXT NOT NULL, price REAL NOT NULL, change_percent REAL NOT NULL, currency TEXT NOT NULL,
        observed_at TEXT NOT NULL, PRIMARY KEY(symbol, observed_at)
      );
      CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY, kind TEXT NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL, score INTEGER NOT NULL,
        created_at TEXT NOT NULL, url TEXT, delivered_at TEXT
      );
    `);
  }

  insertNews(item: NewsItem): boolean {
    const result = this.#db.prepare(`INSERT OR IGNORE INTO news_items
      (id,dedup_key,title,summary,url,source,published_at,collected_at,topic,category,relevance_score,confidence_score)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).run(item.id,item.dedupKey,item.title,item.summary,item.url,item.source,item.publishedAt,item.collectedAt,item.topic,item.category,item.relevanceScore,item.confidenceScore);
    return Number(result.changes) === 1;
  }

  listNews(limit: number): readonly NewsItem[] {
    return this.#db.prepare("SELECT * FROM news_items ORDER BY published_at DESC LIMIT ?").all(limit).map((row) => ({
      id: asString(row,"id"), dedupKey: asString(row,"dedup_key"), title: asString(row,"title"), summary: asString(row,"summary"),
      url: asString(row,"url"), source: asString(row,"source"), publishedAt: asString(row,"published_at"), collectedAt: asString(row,"collected_at"),
      topic: asString(row,"topic") === "ai" ? "ai" : "fc_porto", category: asCategory(row),
      relevanceScore: asNumber(row,"relevance_score"), confidenceScore: asNumber(row,"confidence_score")
    }));
  }

  insertMarketQuote(quote: MarketQuote): void {
    this.#db.prepare("INSERT OR REPLACE INTO market_quotes(symbol,price,change_percent,currency,observed_at) VALUES(?,?,?,?,?)")
      .run(quote.symbol,quote.price,quote.changePercent,quote.currency,quote.observedAt);
  }

  listLatestMarketQuotes(): readonly MarketQuote[] {
    const rows = this.#db.prepare(`SELECT q.* FROM market_quotes q JOIN (SELECT symbol, MAX(observed_at) max_time FROM market_quotes GROUP BY symbol) x ON q.symbol=x.symbol AND q.observed_at=x.max_time ORDER BY q.symbol`).all();
    return rows.map(marketQuoteFromRow);
  }

  getLatestMarketQuote(symbol: string): MarketQuote | undefined {
    const row = this.#db.prepare("SELECT * FROM market_quotes WHERE symbol = ? ORDER BY observed_at DESC LIMIT 1").get(symbol);
    return row === undefined ? undefined : marketQuoteFromRow(row);
  }

  insertAlert(alert: Alert): void {
    this.#db.prepare("INSERT OR IGNORE INTO alerts(id,kind,title,message,score,created_at,url) VALUES(?,?,?,?,?,?,?)")
      .run(alert.id,alert.kind,alert.title,alert.message,alert.score,alert.createdAt,alert.url ?? null);
  }

  listPendingMarketAlerts(): readonly Alert[] {
    return this.#db.prepare("SELECT * FROM alerts WHERE kind = 'market_move' AND delivered_at IS NULL ORDER BY created_at").all().map(alertFromRow);
  }

  markAlertDelivered(id: string, deliveredAt: string): void {
    this.#db.prepare("UPDATE alerts SET delivered_at = ? WHERE id = ?").run(deliveredAt, id);
  }

  close(): void { this.#db.close(); }
}
