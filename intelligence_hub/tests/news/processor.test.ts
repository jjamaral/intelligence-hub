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
