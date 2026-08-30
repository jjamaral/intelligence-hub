import assert from "node:assert/strict";
import { test } from "node:test";
import { TwelveDataProvider } from "../../src/market/twelve-data.js";

test("TwelveDataProvider decodes typed quote fields",async()=>{const fakeFetch=async(input:RequestInfo|URL,_init?:RequestInit):Promise<Response>=>{assert.ok(String(input).includes("symbol=TSLA"));return new Response(JSON.stringify({close:"412.50",percent_change:"-2.15",currency:"USD"}),{status:200});};const quote=await new TwelveDataProvider("key",fakeFetch).getQuote("TSLA");assert.equal(quote.symbol,"TSLA");assert.equal(quote.price,412.5);assert.equal(quote.changePercent,-2.15);});
