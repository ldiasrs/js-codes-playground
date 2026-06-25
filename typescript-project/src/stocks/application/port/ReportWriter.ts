import { AnalysisResult } from "../../domain/model/StockAnalysis";

export interface ReportMeta {
  readonly provider: string;
  readonly model: string;
  readonly generatedAt: Date;
}

export interface WrittenReport {
  readonly reportPath: string;
  readonly dataPath: string;
}

/** Driven port: persists the analysis as a report. */
export interface ReportWriter {
  write(results: AnalysisResult[], meta: ReportMeta): Promise<WrittenReport>;
}
