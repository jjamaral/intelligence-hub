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
