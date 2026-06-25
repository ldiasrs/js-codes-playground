import * as fs from "fs";
import * as path from "path";
import { AnalysisResult } from "../../domain/model/StockAnalysis";
import {
  ReportMeta,
  ReportWriter,
  WrittenReport,
} from "../../application/port/ReportWriter";
import { HtmlReportRenderer } from "./HtmlReportRenderer";

/**
 * Writes the report to data/stocks/reports/<YYYY-MM-DD-HHMM>/:
 *  - report.html  (rendered)
 *  - data.json    (raw results, for auditing / re-rendering)
 */
export class HtmlReportWriter implements ReportWriter {
  private readonly renderer = new HtmlReportRenderer();

  constructor(private readonly reportsDir: string) {}

  async write(results: AnalysisResult[], meta: ReportMeta): Promise<WrittenReport> {
    const stamp = this.timestamp(meta.generatedAt);
    const outDir = path.join(this.reportsDir, stamp);
    fs.mkdirSync(outDir, { recursive: true });

    const reportPath = path.join(outDir, "report.html");
    const dataPath = path.join(outDir, "data.json");

    const html = this.renderer.render(results, stamp, `${meta.provider}/${meta.model}`);
    fs.writeFileSync(reportPath, html, "utf8");
    fs.writeFileSync(dataPath, JSON.stringify(results, null, 2), "utf8");

    return { reportPath, dataPath };
  }

  /** Readable, sortable folder name, e.g. 2026-05-21-1001. */
  private timestamp(date: Date): string {
    const p = (n: number) => String(n).padStart(2, "0");
    return (
      `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}` +
      `-${p(date.getHours())}${p(date.getMinutes())}`
    );
  }
}
