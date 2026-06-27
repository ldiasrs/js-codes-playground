import { FieldKey } from "./FieldDefinition";
import { FieldStatus } from "./FieldStatus";
import { Market } from "./Market";
import { StockProfile } from "./StockProfile";

/** A single field: display value, the raw number (for re-scoring), plus its status. */
export interface StockField {
  readonly value: string;
  /** Raw numeric value, when known — lets the FSS recompute in code from cache. */
  readonly numeric?: number;
  readonly status: FieldStatus;
}

/** A successful fundamental analysis of one ticker. */
export interface StockAnalysis {
  readonly kind: "analysis";
  readonly ticker: string;
  readonly company: string;
  readonly market: Market;
  readonly currency: string;
  readonly sector: string;
  readonly profiles: StockProfile[];
  readonly fields: Record<FieldKey, StockField>;
  readonly verdict: string;
  readonly overall: FieldStatus;
}

/** A ticker we could not analyze (LLM/parse error). */
export interface FailedAnalysis {
  readonly kind: "failed";
  readonly ticker: string;
  readonly market: Market;
  readonly error: string;
}

export type AnalysisResult = StockAnalysis | FailedAnalysis;

export const isFailed = (r: AnalysisResult): r is FailedAnalysis => r.kind === "failed";

export function failedAnalysis(ticker: string, market: Market, error: string): FailedAnalysis {
  return { kind: "failed", ticker, market, error };
}
