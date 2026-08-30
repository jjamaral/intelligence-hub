import { readFile } from "node:fs/promises";
import type { AppConfig, NewsFeedConfig, QuietHours } from "../domain/types.js";

const DEFAULT_NEWS_FEEDS: readonly NewsFeedConfig[] = [
  { id: "fc-porto-all", topic: "fc_porto", source: "Google News", url: "https://news.google.com/rss/search?q=%22FC+Porto%22+futebol&hl=pt-PT&gl=PT&ceid=PT:pt-150" },
  { id: "fc-porto-abola", topic: "fc_porto", source: "A Bola via Google News", url: "https://news.google.com/rss/search?q=%22FC+Porto%22+site%3Aabola.pt&hl=pt-PT&gl=PT&ceid=PT:pt-150" },
  { id: "fc-porto-record", topic: "fc_porto", source: "Record via Google News", url: "https://news.google.com/rss/search?q=%22FC+Porto%22+site%3Arecord.pt&hl=pt-PT&gl=PT&ceid=PT:pt-150" },
  { id: "fc-porto-ojogo", topic: "fc_porto", source: "O Jogo via Google News", url: "https://news.google.com/rss/search?q=%22FC+Porto%22+site%3Aojogo.pt&hl=pt-PT&gl=PT&ceid=PT:pt-150" },
  { id: "ai-all", topic: "ai", source: "Google News", url: "https://news.google.com/rss/search?q=OpenAI+OR+Anthropic+OR+Gemini+OR+Mistral+AI+model&hl=en-US&gl=US&ceid=US:en" },
  { id: "ai-openai", topic: "ai", source: "OpenAI via Google News", url: "https://news.google.com/rss/search?q=site%3Aopenai.com+OpenAI&hl=en-US&gl=US&ceid=US:en" },
  { id: "ai-anthropic", topic: "ai", source: "Anthropic via Google News", url: "https://news.google.com/rss/search?q=site%3Aanthropic.com+Anthropic&hl=en-US&gl=US&ceid=US:en" },
  { id: "ai-google", topic: "ai", source: "Google AI via Google News", url: "https://news.google.com/rss/search?q=site%3Ablog.google+Gemini+AI&hl=en-US&gl=US&ceid=US:en" }
];

const DEFAULT_MARKET_SYMBOLS = ["SPY", "TSLA", "UBER", "SPCX"] as const;
const DEFAULT_QUIET_HOURS: QuietHours = { start: "23:00", end: "07:30" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNumber(record: Record<string, unknown>, key: string, fallback: number): number {
  const value = record[key];
  if (value === undefined) return fallback;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${key} must be a finite number`);
  }
  return value;
}

function readOptionalString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new Error(`${key} must be a string`);
  return value;
}

function readStringArray(record: Record<string, unknown>, key: string, fallback: readonly string[]): readonly string[] {
  const value = record[key];
  if (value === undefined) return fallback;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    throw new Error(`${key} must be an array of non-empty strings`);
  }
  return value.map((item) => item.trim().toUpperCase());
}

function isClock(value: string): boolean {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function readQuietHours(record: Record<string, unknown>): QuietHours {
  const flatStart = record["quiet_start"];
  const flatEnd = record["quiet_end"];
  if (flatStart !== undefined || flatEnd !== undefined) {
    if (typeof flatStart !== "string" || !isClock(flatStart)) throw new Error("quiet_start must be HH:MM");
    if (typeof flatEnd !== "string" || !isClock(flatEnd)) throw new Error("quiet_end must be HH:MM");
    return { start: flatStart, end: flatEnd };
  }
  const value = record["quiet_hours"];
  if (value === undefined) return DEFAULT_QUIET_HOURS;
  if (!isRecord(value)) throw new Error("quiet_hours must be an object");

  const start = value["start"];
  const end = value["end"];
  if (typeof start !== "string" || !isClock(start)) throw new Error("quiet_hours.start must be HH:MM");
  if (typeof end !== "string" || !isClock(end)) throw new Error("quiet_hours.end must be HH:MM");
  return { start, end };
}

function readNewsFeeds(record: Record<string, unknown>): readonly NewsFeedConfig[] {
  const value = record["news_feeds"];
  if (value === undefined) return DEFAULT_NEWS_FEEDS;
  if (!Array.isArray(value)) throw new Error("news_feeds must be an array");

  return value.map((item, index) => {
    if (!isRecord(item)) throw new Error(`news_feeds[${index}] must be an object`);
    const id = item["id"];
    const topic = item["topic"];
    const url = item["url"];
    const source = item["source"];
    if (typeof id !== "string" || id.trim() === "") throw new Error(`news_feeds[${index}].id must be a non-empty string`);
    if (topic !== "fc_porto" && topic !== "ai") throw new Error(`news_feeds[${index}].topic is invalid`);
    if (typeof url !== "string" || !/^https?:\/\//.test(url)) throw new Error(`news_feeds[${index}].url must be http(s)`);
    if (typeof source !== "string" || source.trim() === "") throw new Error(`news_feeds[${index}].source must be a non-empty string`);
    return { id, topic, url, source };
  });
}

export function parseAppConfig(value: unknown): AppConfig {
  if (!isRecord(value)) throw new Error("App configuration must be an object");

  const port = readNumber(value, "port", 8099);
  const newsPollMinutes = readNumber(value, "news_poll_minutes", 15);
  const marketPollMinutes = readNumber(value, "market_poll_minutes", 15);
  const alertThreshold = readNumber(value, "alert_threshold", 75);

  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("port must be an integer between 1 and 65535");
  if (newsPollMinutes < 1) throw new Error("news_poll_minutes must be >= 1");
  if (marketPollMinutes < 1) throw new Error("market_poll_minutes must be >= 1");
  if (alertThreshold < 0 || alertThreshold > 100) throw new Error("alert_threshold must be between 0 and 100");

  const notifyService = readOptionalString(value, "notify_service");
  const twelveDataApiKey = readOptionalString(value, "twelve_data_api_key");

  return {
    port,
    databasePath: readOptionalString(value, "database_path") ?? "/data/intelligence-hub.db",
    newsPollMinutes,
    marketPollMinutes,
    alertThreshold,
    ...(notifyService === undefined ? {} : { notifyService }),
    ...(twelveDataApiKey === undefined ? {} : { twelveDataApiKey }),
    quietHours: readQuietHours(value),
    marketSymbols: readStringArray(value, "market_symbols", DEFAULT_MARKET_SYMBOLS),
    newsFeeds: readNewsFeeds(value)
  };
}

export async function loadAppConfig(path = "/data/options.json"): Promise<AppConfig> {
  try {
    const raw = await readFile(path, "utf8");
    return parseAppConfig(JSON.parse(raw) as unknown);
  } catch (error: unknown) {
    if (error instanceof SyntaxError) throw new Error(`Invalid JSON in ${path}: ${error.message}`);
    throw error;
  }
}
