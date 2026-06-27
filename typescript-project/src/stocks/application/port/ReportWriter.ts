import { AnalysisResult } from "../../domain/model/StockAnalysis";

export interface ReportMeta {
  /** Source label shown in the report header, e.g. "BR=statusinvest, US=claude-cli". */
  readonly source: string;
  readonly generatedAt: Date;
  /** Date of the cache being read/written (YYYY-MM-DD). */
  readonly cacheDate: string;
  /** Whether data fetching is on (false = cache-only / read-only). */
  readonly fetchEnabled: boolean;
}

export interface WrittenReport {
  readonly reportPath: string;
  readonly dataPath: string;
}

/** Driven port: persists the analysis as a report. */
export interface ReportWriter {
  write(results: AnalysisResult[], meta: ReportMeta): Promise<WrittenReport>;
}
