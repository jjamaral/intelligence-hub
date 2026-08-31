import assert from "node:assert/strict";
import { test } from "node:test";
import { HomeAssistantClient } from "../../src/ha/client.js";

test("HomeAssistantClient uses Supervisor token and notify service",async()=>{let seenUrl="",seenAuth="";const fakeFetch=async(input:RequestInfo|URL,init?:RequestInit):Promise<Response>=>{seenUrl=String(input);const headers=new Headers(init?.headers);seenAuth=headers.get("authorization")??"";return new Response("{}",{status:200});};const client=new HomeAssistantClient("token",fakeFetch);await client.notify("mobile_app_phone",{id:"a",kind:"news",title:"FC Porto",message:"Update",score:90,createdAt:new Date().toISOString()});assert.ok(seenUrl.endsWith("/services/notify/mobile_app_phone"));assert.equal(seenAuth,"Bearer token");});

test("HomeAssistantClient aborts a stalled Supervisor request", async () => {
  const keepEventLoopAlive = setTimeout(() => undefined, 50);
  const neverResponds = (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
    });
  const client = new HomeAssistantClient("token", neverResponds, "http://supervisor/core/api", 5);

  try {
    await assert.rejects(
      () => client.setState("sensor.intelligence_test", "1"),
      /timed out|timeout/i
    );
  } finally {
    clearTimeout(keepEventLoopAlive);
  }
});

test("publishOverview includes latest story details for Home Assistant dashboards", async () => {
  const payloads: unknown[] = [];
  const fakeFetch = async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    payloads.push(JSON.parse(String(init?.body)) as unknown);
    return new Response("{}", { status: 200 });
  };
  const client = new HomeAssistantClient("token", fakeFetch);

  await client.publishOverview([
    {
      id: "news-1",
      dedupKey: "dedup-1",
      title: "Fabrizio Romano reports FC Porto transfer talks",
      summary: "Transfer update",
      url: "https://x.com/FabrizioRomano/status/1",
      source: "Fabrizio Romano",
      publishedAt: "2026-08-30T12:00:00.000Z",
      collectedAt: "2026-08-30T12:01:00.000Z",
      topic: "fc_porto",
      category: "transfer",
      relevanceScore: 100,
      confidenceScore: 90
    }
  ], []);

  assert.deepEqual(payloads[0], {
    state: "1",
    attributes: {
      latest: "Fabrizio Romano reports FC Porto transfer talks",
      latest_url: "https://x.com/FabrizioRomano/status/1",
      latest_source: "Fabrizio Romano",
      latest_published_at: "2026-08-30T12:00:00.000Z",
      items: [{
        title: "Fabrizio Romano reports FC Porto transfer talks",
        url: "https://x.com/FabrizioRomano/status/1",
        source: "Fabrizio Romano",
        published_at: "2026-08-30T12:00:00.000Z",
        category: "transfer",
        relevance: 100
      }]
    }
  });
  assert.deepEqual(payloads[2], {
    state: "1",
    attributes: {
      latest: "Fabrizio Romano reports FC Porto transfer talks",
      latest_url: "https://x.com/FabrizioRomano/status/1",
      latest_source: "Fabrizio Romano",
      latest_published_at: "2026-08-30T12:00:00.000Z",
      items: [{
        title: "Fabrizio Romano reports FC Porto transfer talks",
        url: "https://x.com/FabrizioRomano/status/1",
        source: "Fabrizio Romano",
        published_at: "2026-08-30T12:00:00.000Z",
        category: "transfer",
        relevance: 100
      }]
    }
  });
});

test("publishOverview limits dashboard news to five items", async () => {
  const payloads: unknown[] = [];
  const fakeFetch = async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    payloads.push(JSON.parse(String(init?.body)) as unknown);
    return new Response("{}", { status: 200 });
  };
  const news = Array.from({ length: 6 }, (_, index) => ({
    id: `news-${index}`,
    dedupKey: `dedup-${index}`,
    title: `Story ${index}`,
    summary: "Summary",
    url: `https://example.com/${index}`,
    source: "Example",
    publishedAt: `2026-08-30T1${index}:00:00.000Z`,
    collectedAt: "2026-08-30T16:01:00.000Z",
    topic: "ai" as const,
    category: "general" as const,
    relevanceScore: 35,
    confidenceScore: 70
  }));

  await new HomeAssistantClient("token", fakeFetch).publishOverview(news, []);

  const aiPayload = payloads[1] as { attributes: { items: readonly { title: string }[] } };
  assert.deepEqual(aiPayload.attributes.items.map((item) => item.title), ["Story 0", "Story 1", "Story 2", "Story 3", "Story 4"]);
});

test("publishOverview creates a compact market overview for dashboards", async () => {
  const payloads: unknown[] = [];
  const fakeFetch = async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    payloads.push(JSON.parse(String(init?.body)) as unknown);
    return new Response("{}", { status: 200 });
  };

  await new HomeAssistantClient("token", fakeFetch).publishOverview([], [{
    symbol: "TSLA",
    price: 412.5,
    changePercent: -3.25,
    currency: "USD",
    observedAt: "2026-08-30T12:00:00.000Z"
  }], 3);

  assert.deepEqual(payloads[3], {
    state: "1",
    attributes: {
      alert_threshold: 3,
      quotes: [{
        symbol: "TSLA",
        price: 412.5,
        change_percent: -3.25,
        currency: "USD",
        observed_at: "2026-08-30T12:00:00.000Z",
        alerting: true
      }]
    }
  });
});

test("publishOverview limits the market overview to twelve quotes", async () => {
  const payloads: unknown[] = [];
  const fakeFetch = async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    payloads.push(JSON.parse(String(init?.body)) as unknown);
    return new Response("{}", { status: 200 });
  };
  const quotes = Array.from({ length: 13 }, (_, index) => ({
    symbol: `S${index}`,
    price: index,
    changePercent: index,
    currency: "USD",
    observedAt: "2026-08-30T12:00:00.000Z"
  }));

  await new HomeAssistantClient("token", fakeFetch).publishOverview([], quotes, 3);

  const overview = payloads[3] as { attributes: { quotes: readonly unknown[] } };
  assert.equal(overview.attributes.quotes.length, 12);
});

test("publishHealth creates a collector status sensor", async () => {
  let seenUrl = "";
  let payload: unknown;
  const fakeFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    seenUrl = String(input);
    payload = JSON.parse(String(init?.body)) as unknown;
    return new Response("{}", { status: 200 });
  };

  await new HomeAssistantClient("token", fakeFetch).publishHealth({
    status: "degraded",
    collectors: {
      news: { status: "degraded", errors: ["feed: unavailable"], lastAttemptAt: "2026-08-30T12:00:00.000Z" },
      markets: { status: "disabled", errors: [] }
    }
  });

  assert.ok(seenUrl.endsWith("/states/sensor.intelligence_hub_status"));
  assert.deepEqual(payload, {
    state: "degraded",
    attributes: {
      news_status: "degraded",
      news_errors: ["feed: unavailable"],
      news_last_attempt_at: "2026-08-30T12:00:00.000Z",
      news_last_success_at: "",
      markets_status: "disabled",
      markets_errors: [],
      markets_last_attempt_at: "",
      markets_last_success_at: ""
    }
  });
});

test("dashboard attributes truncate external text and bound health errors", async () => {
  const payloads: unknown[] = [];
  const fakeFetch = async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    payloads.push(JSON.parse(String(init?.body)) as unknown);
    return new Response("{}", { status: 200 });
  };
  const longText = "x".repeat(2_000);
  const client = new HomeAssistantClient("token", fakeFetch);

  await client.publishOverview([{
    id: "news",
    dedupKey: "dedup",
    title: longText,
    summary: longText,
    url: `https://example.com/${longText}`,
    source: longText,
    publishedAt: "2026-08-30T12:00:00.000Z",
    collectedAt: "2026-08-30T12:01:00.000Z",
    topic: "ai",
    category: "general",
    relevanceScore: 35,
    confidenceScore: 70
  }], []);
  await client.publishHealth({
    status: "degraded",
    collectors: {
      news: { status: "degraded", errors: Array.from({ length: 8 }, () => longText) },
      markets: { status: "degraded", errors: Array.from({ length: 8 }, () => longText) }
    }
  });

  const newsPayload = payloads[1] as { attributes: { items: readonly { title: string; url: string; source: string }[] } };
  const statusPayload = payloads[4] as { attributes: { news_errors: readonly string[]; markets_errors: readonly string[] } };
  assert.equal(newsPayload.attributes.items[0]?.title.length, 300);
  assert.equal(newsPayload.attributes.items[0]?.url.length, 1_000);
  assert.equal(newsPayload.attributes.items[0]?.source.length, 120);
  assert.equal(statusPayload.attributes.news_errors.length, 5);
  assert.equal(statusPayload.attributes.news_errors[0]?.length, 500);
  assert.equal(statusPayload.attributes.markets_errors.length, 5);
});
