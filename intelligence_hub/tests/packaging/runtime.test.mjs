import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { test } from "node:test";

function listenOnRandomPort(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address === null || typeof address === "string") {
        reject(new Error("Expected a TCP server address"));
        return;
      }
      resolve(address.port);
    });
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => error === undefined ? resolve() : reject(error));
  });
}

async function waitForHealth(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {
      // Startup connection failures are expected until the listener opens.
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(`Health endpoint did not become ready within ${timeoutMs}ms`);
}

test("compiled runtime opens health before a stalled initial feed completes", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ih-runtime-"));
  const stalledFeed = createServer(() => undefined);
  const appPortProbe = createServer();
  const stalledFeedPort = await listenOnRandomPort(stalledFeed);
  const appPort = await listenOnRandomPort(appPortProbe);
  await closeServer(appPortProbe);
  const optionsPath = join(dir, "options.json");
  await writeFile(optionsPath, JSON.stringify({
    port: appPort,
    database_path: join(dir, "runtime.db"),
    market_symbols: [],
    news_feeds: [{
      id: "stalled",
      topic: "fc_porto",
      source: "Stalled feed",
      url: `http://127.0.0.1:${stalledFeedPort}/rss`
    }]
  }));
  const child = spawn(process.execPath, ["dist/index.js"], {
    cwd: new URL("../../", import.meta.url),
    env: { ...process.env, INTELLIGENCE_HUB_OPTIONS: optionsPath },
    stdio: "ignore"
  });

  try {
    const health = await waitForHealth(`http://127.0.0.1:${appPort}/health`, 2_000);
    assert.equal(health.status, "starting");
    assert.equal(health.collectors.news.status, "running");
  } finally {
    child.kill("SIGTERM");
    stalledFeed.closeAllConnections();
    await closeServer(stalledFeed);
    await rm(dir, { recursive: true, force: true });
  }
});
