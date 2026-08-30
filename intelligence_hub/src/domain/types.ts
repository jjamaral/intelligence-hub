export type WatchKind = "news" | "market";
export type Topic = "fc_porto" | "ai" | "markets";
export type NewsCategory =
  | "transfer"
  | "injury"
  | "match"
  | "official"
  | "rumour"
  | "new_model"
  | "api"
  | "developer_tool"
  | "research"
  | "general";

export interface QuietHours {
  readonly start: string;
  readonly end: string;
}

export interface NewsFeedConfig {
  readonly id: string;
  readonly topic: Exclude<Topic, "markets">;
  readonly url: string;
  readonly source: string;
  readonly priorityBoost?: number;
}

export type CollectorStatus = "disabled" | "idle" | "running" | "ok" | "degraded";

export interface CollectorHealth {
  readonly status: CollectorStatus;
  readonly errors: readonly string[];
  readonly lastAttemptAt?: string;
  readonly lastSuccessAt?: string;
}

export interface HubHealth {
  readonly status: "starting" | "ready" | "degraded";
  readonly collectors: {
    readonly news: CollectorHealth;
    readonly markets: CollectorHealth;
  };
}

export interface AppConfig {
  readonly port: number;
  readonly databasePath: string;
  readonly newsPollMinutes: number;
  readonly marketPollMinutes: number;
  readonly alertThreshold: number;
  readonly notifyService?: string;
  readonly twelveDataApiKey?: string;
  readonly quietHours: QuietHours;
  readonly marketSymbols: readonly string[];
  readonly newsFeeds: readonly NewsFeedConfig[];
}

export interface Watch {
  readonly id: string;
  readonly kind: WatchKind;
  readonly label: string;
  readonly topic?: Topic;
  readonly symbol?: string;
}

export interface NewsItem {
  readonly id: string;
  readonly dedupKey: string;
  readonly title: string;
  readonly summary: string;
  readonly url: string;
  readonly source: string;
  readonly publishedAt: string;
  readonly collectedAt: string;
  readonly topic: Exclude<Topic, "markets">;
  readonly category: NewsCategory;
  readonly relevanceScore: number;
  readonly confidenceScore: number;
}

export interface MarketQuote {
  readonly symbol: string;
  readonly price: number;
  readonly changePercent: number;
  readonly currency: string;
  readonly observedAt: string;
}

export type AlertKind = "news" | "market_move";

export interface Alert {
  readonly id: string;
  readonly kind: AlertKind;
  readonly title: string;
  readonly message: string;
  readonly score: number;
  readonly createdAt: string;
  readonly url?: string;
}
