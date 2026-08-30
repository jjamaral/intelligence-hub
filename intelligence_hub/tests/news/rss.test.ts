import assert from "node:assert/strict";
import { test } from "node:test";
import { parseRss } from "../../src/news/rss.js";

const xml = `<?xml version="1.0"?><rss><channel><item><title><![CDATA[FC Porto confirma reforço]]></title><link>https://example.com/a</link><description><![CDATA[O clube confirmou a contratação.]]></description><pubDate>Sun, 30 Aug 2026 12:00:00 GMT</pubDate></item></channel></rss>`;

test("parseRss normalizes RSS items", () => {
  const items = parseRss(xml);
  assert.equal(items.length,1);
  assert.equal(items[0]?.title,"FC Porto confirma reforço");
  assert.equal(items[0]?.url,"https://example.com/a");
  assert.equal(items[0]?.publishedAt,"2026-08-30T12:00:00.000Z");
});
