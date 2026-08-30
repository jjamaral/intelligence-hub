import assert from "node:assert/strict";
import { test } from "node:test";
import { HomeAssistantClient } from "../../src/ha/client.js";

test("HomeAssistantClient uses Supervisor token and notify service",async()=>{let seenUrl="",seenAuth="";const fakeFetch=async(input:RequestInfo|URL,init?:RequestInit):Promise<Response>=>{seenUrl=String(input);const headers=new Headers(init?.headers);seenAuth=headers.get("authorization")??"";return new Response("{}",{status:200});};const client=new HomeAssistantClient("token",fakeFetch);await client.notify("mobile_app_phone",{id:"a",kind:"news",title:"FC Porto",message:"Update",score:90,createdAt:new Date().toISOString()});assert.ok(seenUrl.endsWith("/services/notify/mobile_app_phone"));assert.equal(seenAuth,"Bearer token");});
