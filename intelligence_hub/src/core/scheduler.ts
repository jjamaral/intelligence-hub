import type { IntelligenceHub } from "./intelligence-hub.js";
export interface Scheduler{stop():void}
export function startScheduler(hub:IntelligenceHub):Scheduler{const news=setInterval(()=>{void hub.collectNews().catch(console.error);},hub.config.newsPollMinutes*60_000);const markets=setInterval(()=>{void hub.collectMarkets().catch(console.error);},hub.config.marketPollMinutes*60_000);return{stop(){clearInterval(news);clearInterval(markets);}};}
