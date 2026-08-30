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
      latest_published_at: "2026-08-30T12:00:00.000Z"
    }
  });
  assert.deepEqual(payloads[2], {
    state: "1",
    attributes: {
      latest: "Fabrizio Romano reports FC Porto transfer talks",
      latest_url: "https://x.com/FabrizioRomano/status/1",
      latest_source: "Fabrizio Romano",
      latest_published_at: "2026-08-30T12:00:00.000Z"
    }
  });
});
