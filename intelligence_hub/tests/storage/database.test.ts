import assert from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { IntelligenceDatabase } from "../../src/storage/database.js";
import type { NewsItem } from "../../src/domain/types.js";

function sampleNews(): NewsItem {
  return { id:"n1", dedupKey:"d1", title:"FC Porto confirma reforço", summary:"Resumo", url:"https://example.com/a", source:"Example", publishedAt:"2026-08-30T10:00:00.000Z", collectedAt:"2026-08-30T10:01:00.000Z", topic:"fc_porto", category:"transfer", relevanceScore:90, confidenceScore:80 };
}

test("database persists news and rejects duplicate dedup keys", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ih-"));
  const path = join(dir, "test.db");
  try {
    const db = new IntelligenceDatabase(path); db.initialize();
    assert.equal(db.insertNews(sampleNews()), true);
    assert.equal(db.insertNews({ ...sampleNews(), id:"n2" }), false);
    assert.equal(db.listNews(10).length, 1);
    db.close();
    const reopened = new IntelligenceDatabase(path); reopened.initialize();
    assert.equal(reopened.listNews(10).length, 1); reopened.close();
  } finally { await rm(dir,{recursive:true,force:true}); }
});
