import { StockAnalysis } from "./StockAnalysis";

/** A scored + positioned stock produced by the StockRanker. */
export interface RankedStock {
  readonly analysis: StockAnalysis;
  /** 0–100, higher = stronger fundamentals. */
  readonly score: number;
  /** 1-based position in the ranking (1 = weakest, shown first). */
  readonly position: number;
}
