import { StockAnalysis } from "../../domain/model/StockAnalysis";

/** Driven port: a per-key store of already-computed analyses (e.g. daily file). */
export interface AnalysisCache {
  get(key: string): StockAnalysis | null;
  put(key: string, analysis: StockAnalysis): void;
}
