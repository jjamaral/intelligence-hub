import assert from "node:assert/strict";
import { test } from "node:test";
import { processFeedItem } from "../../src/news/processor.js";

const now = "2026-08-30T13:00:00.000Z";

test("FC Porto confirmed transfer scores as important", () => {
  const item = processFeedItem({title:"FC Porto confirma contratação de novo avançado",url:"https://example.com/1",summary:"O clube oficializou o reforço",publishedAt:now},{id:"f",topic:"fc_porto",url:"https://feed",source:"Example"},now);
  assert.equal(item.category,"transfer");
  assert.ok(item.relevanceScore >= 75);
});

test("AI model launch is classified as new_model", () => {
  const item = processFeedItem({title:"OpenAI launches new GPT model",url:"https://example.com/2",summary:"New model for developers",publishedAt:now},{id:"a",topic:"ai",url:"https://feed",source:"Example"},now);
  assert.equal(item.category,"new_model");
  assert.ok(item.relevanceScore >= 75);
});

test("equivalent normalized headlines have the same dedup key", () => {
  const a = processFeedItem({title:"FC Porto: confirma reforço!",url:"https://a",summary:"",publishedAt:now},{id:"f",topic:"fc_porto",url:"https://feed",source:"A"},now);
  const b = processFeedItem({title:"FC PORTO confirma reforço",url:"https://b",summary:"",publishedAt:now},{id:"f",topic:"fc_porto",url:"https://feed",source:"B"},now);
  assert.equal(a.dedupKey,b.dedupKey);
});

test("Fabrizio Romano transfer reports receive the highest source priority", () => {
  const report = {
    title: "Fabrizio Romano: FC Porto interested in new striker",
    url: "https://x.com/FabrizioRomano/status/1",
    summary: "Transfer interest reported by Fabrizio Romano",
    publishedAt: now
  };
  const prioritized = processFeedItem(
    report,
    {
      id: "fc-porto-fabrizio-romano",
      topic: "fc_porto",
      url: "https://news.google.com/rss/search?q=fabrizio",
      source: "Fabrizio Romano",
      priorityBoost: 35
    },
    now
  );
  const standard = processFeedItem(
    report,
    { id: "standard", topic: "fc_porto", url: "https://example.com/rss", source: "Standard source" },
    now
  );

  assert.equal(prioritized.category, "transfer");
  assert.equal(prioritized.relevanceScore, 100);
  assert.equal(standard.relevanceScore, 78);
  assert.ok(prioritized.relevanceScore > standard.relevanceScore);
});
