import { Stock } from "../../domain/model/Stock";
import { StockAnalysis } from "../../domain/model/StockAnalysis";

/**
 * Driven port: produces a fundamental analysis for one ticker, regardless of
 * source. Implemented by the AI path (LlmStockAnalyzer) and the finance-API path
 * (Brapi/Fmp + MarketRouting). Throws on failure — the use case turns that into a
 * FailedAnalysis.
 */
export interface StockAnalyzer {
  /** Human-readable source id, e.g. "finance-apis" or "claude". */
  readonly name: string;
  analyze(stock: Stock): Promise<StockAnalysis>;
}
