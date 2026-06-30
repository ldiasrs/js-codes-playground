import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { SheetExporter } from "../../application/port/SheetExporter";
import { ReportMeta } from "../../application/port/ReportWriter";
import { FieldStatus } from "../../domain/model/FieldStatus";
import { AnalysisResult } from "../../domain/model/StockAnalysis";
import { StockRanker } from "../../domain/service/StockRanker";
import { IndexSheet, SUMMARY_HEADERS, buildIndexSheet, buildSheetModel, fieldStatusOf } from "./sheetModel";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

export interface GoogleSheetConfig {
  readonly spreadsheetId: string;
  readonly clientEmail: string;
  readonly privateKey: string;
}

type RGB = { red: number; green: number; blue: number };

const HEADER_BG: RGB = { red: 0.17, green: 0.24, blue: 0.31 };
const WHITE: RGB = { red: 1, green: 1, blue: 1 };
const STATUS_BG: Record<FieldStatus, RGB | null> = {
  good: { red: 0.71, green: 0.88, blue: 0.71 },
  caution: { red: 1.0, green: 0.9, blue: 0.6 },
  weak: { red: 0.96, green: 0.78, blue: 0.78 },
  na: null,
};

/**
 * Exports the analysis + FSS ranking to a new dated tab in the configured Google
 * Sheet (same document + service-account auth as `update_invest_spread_sheet`).
 * Best-FSS first; header frozen + colored; FSS / pillar / field cells color-coded.
 */
export class GoogleSheetExporter implements SheetExporter {
  constructor(
    private readonly config: GoogleSheetConfig,
    private readonly ranker: StockRanker,
  ) {}

  async export(results: AnalysisResult[], meta: ReportMeta): Promise<string> {
    const doc = await this.openDoc();
    const stamp = this.stamp(meta.generatedAt);
    const urls: string[] = [];

    // One ranking tab per market, each ranked independently (no index here).
    for (const market of ["US", "BR"] as const) {
      const model = buildSheetModel(
        results.filter((r) => r.market === market),
        this.ranker,
      );
      if (!model.rows.length) continue;

      const sheet = await doc.addSheet({
        title: `Ranking ${market} ${stamp}`,
        headerValues: model.headers,
        // Default grid is 26 cols — size it to fit all indicator columns.
        gridProperties: {
          rowCount: model.rows.length + 1,
          columnCount: model.headers.length,
          frozenRowCount: 1,
          frozenColumnCount: 2,
        },
      });
      await sheet.addRows(model.rows);
      await this.applyColors(sheet, model);
      urls.push(`${market}: https://docs.google.com/spreadsheets/d/${this.config.spreadsheetId}/edit#gid=${sheet.sheetId}`);
    }

    if (!urls.length) throw new Error("no analyzed stocks to export");

    // One standalone bilingual index tab.
    const idxUrl = await this.writeIndexSheet(doc, `Index ${stamp}`);
    urls.push(`Index: ${idxUrl}`);
    return urls.join("  |  ");
  }

  private async openDoc(): Promise<GoogleSpreadsheet> {
    if (!this.config.spreadsheetId || !this.config.clientEmail || !this.config.privateKey) {
      throw new Error("missing Google Sheet config (update_invest_spread_sheet)");
    }
    const jwt = new JWT({ email: this.config.clientEmail, key: this.config.privateKey, scopes: SCOPES });
    const doc = new GoogleSpreadsheet(this.config.spreadsheetId, jwt);
    await doc.loadInfo();
    return doc;
  }

  private async applyColors(sheet: any, model: ReturnType<typeof buildSheetModel>): Promise<void> {
    const cols = model.headers.length;
    const rows = model.rows.length + 1; // + header
    await sheet.loadCells({ startRowIndex: 0, endRowIndex: rows, startColumnIndex: 0, endColumnIndex: cols });

    // Header row.
    for (let c = 0; c < cols; c++) {
      const cell = sheet.getCell(0, c);
      cell.backgroundColor = HEADER_BG;
      cell.textFormat = { bold: true, foregroundColor: WHITE };
      cell.horizontalAlignment = "CENTER";
    }

    const idx = (h: string) => model.headers.indexOf(h);
    const fssCol = idx("FSS");
    const overallCol = idx("Overall");
    const pillarCols = ["Prof", "Debt", "Val", "Grw", "Eff"].map(idx);
    const fieldStart = SUMMARY_HEADERS.length;

    model.meta.forEach((m, i) => {
      const r = i + 1; // data rows start after header

      this.paint(sheet, r, fssCol, this.scoreColor(m.fss), true);
      this.paint(sheet, r, overallCol, STATUS_BG[this.overallStatus(m.fss)]);
      this.center(sheet, r, idx("#"));
      pillarCols.forEach((c, pi) => {
        const v = m.pillars[pi];
        this.paint(sheet, r, c, v === null ? null : this.scoreColor(v));
        this.center(sheet, r, c);
      });
      model.fields.forEach((f, fi) => {
        const status = fieldStatusOf(this.ranker, f.key, m.analysis.fields[f.key]);
        this.paint(sheet, r, fieldStart + fi, STATUS_BG[status]);
      });
    });

    await sheet.saveUpdatedCells();
  }

  /** Creates a standalone bilingual indicator index tab. Returns its URL. */
  private async writeIndexSheet(doc: GoogleSpreadsheet, title: string): Promise<string> {
    const index: IndexSheet = buildIndexSheet(this.ranker);
    const sheet = await doc.addSheet({
      title,
      headerValues: index.headers,
      gridProperties: {
        rowCount: index.rows.length + 1,
        columnCount: index.headers.length,
        frozenRowCount: 1,
        frozenColumnCount: 1,
      },
    });
    await sheet.addRows(index.rows);

    const cols = index.headers.length;
    const rows = index.rows.length + 1;
    await sheet.loadCells({ startRowIndex: 0, endRowIndex: rows, startColumnIndex: 0, endColumnIndex: cols });
    const groupBg: RGB = { red: 0.9, green: 0.92, blue: 0.95 };
    const scoredCol = index.headers.indexOf("Scored (Pontua)");
    // Header.
    for (let c = 0; c < cols; c++) {
      const cell = sheet.getCell(0, c);
      cell.backgroundColor = HEADER_BG;
      cell.textFormat = { bold: true, foregroundColor: WHITE };
    }
    // Group cell shading + scored ✓ highlight.
    index.rows.forEach((_, i) => {
      const r = i + 1;
      const groupCell = sheet.getCell(r, 0);
      groupCell.backgroundColor = groupBg;
      groupCell.textFormat = { bold: true };
      if (scoredCol >= 0) {
        const sc = sheet.getCell(r, scoredCol);
        sc.horizontalAlignment = "CENTER";
        if (sc.value) sc.backgroundColor = STATUS_BG.good as RGB;
      }
    });
    await sheet.saveUpdatedCells();

    return `https://docs.google.com/spreadsheets/d/${this.config.spreadsheetId}/edit#gid=${sheet.sheetId}`;
  }

  private paint(sheet: any, r: number, c: number, color: RGB | null, bold = false): void {
    if (c < 0) return;
    const cell = sheet.getCell(r, c);
    if (color) cell.backgroundColor = color;
    if (bold) cell.textFormat = { bold: true };
  }

  private center(sheet: any, r: number, c: number): void {
    if (c < 0) return;
    sheet.getCell(r, c).horizontalAlignment = "CENTER";
  }

  private scoreColor(score: number): RGB {
    return STATUS_BG[this.overallStatus(score)] as RGB;
  }

  private overallStatus(score: number): FieldStatus {
    return score >= 70 ? "good" : score >= 45 ? "caution" : "weak";
  }

  /** Sheet-tab-safe timestamp (no : \\ / ? * [ ]); seconds avoid same-minute title clashes. */
  private stamp(date: Date): string {
    const p = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}-${p(date.getMinutes())}-${p(date.getSeconds())}`;
  }
}
