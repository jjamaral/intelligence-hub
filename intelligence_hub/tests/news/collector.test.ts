import assert from "node:assert/strict";
import { test } from "node:test";
import { collectFeed } from "../../src/news/collector.js";

test("collectFeed aborts a feed request after its timeout", async () => {
  const keepEventLoopAlive = setTimeout(() => undefined, 50);
  const neverResponds = (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
    });

  try {
    await assert.rejects(
      () => collectFeed(
        { id: "slow", topic: "fc_porto", url: "https://example.com/rss", source: "Slow feed" },
        neverResponds,
        5
      ),
      /timed out|timeout/i
    );
  } finally {
    clearTimeout(keepEventLoopAlive);
  }
});
