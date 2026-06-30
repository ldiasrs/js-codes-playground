import { AnalysisResult } from "../../domain/model/StockAnalysis";
import { ReportMeta } from "./ReportWriter";

/** Driven port: exports the analysis + ranking to an external sheet. Returns a link/label. */
export interface SheetExporter {
  export(results: AnalysisResult[], meta: ReportMeta): Promise<string>;
}
