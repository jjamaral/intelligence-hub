import assert from "node:assert/strict";
import { test } from "node:test";
import { startInitialCollections, type InitialCollectionHub } from "../../src/core/startup.js";

test("initial collection starts without delaying HTTP startup", () => {
  const never = new Promise<never>(() => undefined);
  const hub: InitialCollectionHub = {
    collectNews: () => never,
    collectMarkets: () => never
  };

  assert.equal(startInitialCollections(hub), undefined);
});
