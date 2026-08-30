import type { Alert, MarketQuote, NewsItem } from "../domain/types.js";
export class HomeAssistantClient {
  constructor(private readonly token:string,private readonly fetcher:typeof fetch=fetch,private readonly baseUrl="http://supervisor/core/api"){}
  async setState(entityId:string,state:string,attributes:Readonly<Record<string,unknown>>={}):Promise<void>{await this.request(`/states/${entityId}`,{method:"POST",body:JSON.stringify({state,attributes})});}
  async notify(service:string,alert:Alert):Promise<void>{await this.request(`/services/notify/${encodeURIComponent(service)}`,{method:"POST",body:JSON.stringify({title:alert.title,message:alert.message,data:alert.url?{url:alert.url}: {}})});}
  async publishOverview(news:readonly NewsItem[],quotes:readonly MarketQuote[]):Promise<void>{const fc=news.filter(n=>n.topic==="fc_porto"),ai=news.filter(n=>n.topic==="ai");await Promise.all([this.setState("sensor.intelligence_fc_porto_news",String(fc.length),{latest:fc[0]?.title??""}),this.setState("sensor.intelligence_ai_news",String(ai.length),{latest:ai[0]?.title??""}),...quotes.map(q=>this.setState(`sensor.intelligence_${q.symbol.toLowerCase()}_price`,String(q.price),{change_percent:q.changePercent,currency:q.currency,observed_at:q.observedAt}))]);}
  private async request(path:string,init:RequestInit):Promise<void>{const r=await this.fetcher(`${this.baseUrl}${path}`,{...init,headers:{authorization:`Bearer ${this.token}`,"content-type":"application/json"}});if(!r.ok)throw new Error(`Home Assistant API ${path} returned ${r.status}`);}
}
