import type { MarketQuote } from "../domain/types.js";
export interface MarketProvider { getQuote(symbol:string):Promise<MarketQuote>; }
