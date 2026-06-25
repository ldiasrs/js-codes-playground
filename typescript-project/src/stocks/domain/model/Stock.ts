import { Market } from "./Market";

/** A ticker the user asked us to analyze, with its resolved market. */
export interface Stock {
  readonly ticker: string;
  readonly market: Market;
}
