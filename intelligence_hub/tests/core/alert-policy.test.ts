import assert from "node:assert/strict";
import { test } from "node:test";
import { crossedMarketAlertThreshold, isQuietTime, shouldNotify } from "../../src/core/alert-policy.js";

const quiet={start:"23:00",end:"07:30"};
test("quiet hours span midnight",()=>{assert.equal(isQuietTime(new Date(2026,7,30,23,30),quiet),true);assert.equal(isQuietTime(new Date(2026,7,30,6,0),quiet),true);assert.equal(isQuietTime(new Date(2026,7,30,12,0),quiet),false);});
test("alerts require threshold and non-quiet time",()=>{assert.equal(shouldNotify(90,75,new Date(2026,7,30,12,0),quiet),true);assert.equal(shouldNotify(70,75,new Date(2026,7,30,12,0),quiet),false);assert.equal(shouldNotify(90,75,new Date(2026,7,30,23,30),quiet),false);});

test("market alerts fire only when absolute movement crosses the threshold", () => {
  assert.equal(crossedMarketAlertThreshold(undefined, 3.5, 3), true);
  assert.equal(crossedMarketAlertThreshold(2.5, 3.5, 3), true);
  assert.equal(crossedMarketAlertThreshold(3.5, 4, 3), false);
  assert.equal(crossedMarketAlertThreshold(-2.5, -3.5, 3), true);
  assert.equal(crossedMarketAlertThreshold(-3.5, -2.5, 3), false);
});
