import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { ExportDefinition } from "../../domain/model/ExportDefinition";
import { ExportWriter } from "../../application/port/ExportWriter";
import { GoogleSheetConfig } from "../config/StatusInvestConfig";
import { SheetNamer } from "./SheetNamer";
import { SheetTheme, WHITE, themeFor } from "./sheetThemes";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

const CURRENCY_HEADER = /(valor|custo|preco|retorno|rendimento|desconto|aplicado|liquido|bruto|ganho|ir|iof)/i;
const PERCENTAGE_HEADER = /(^%-|percentual|taxa|rate)/i;
const BRAZILIAN_CURRENCY_FORMAT = { type: "CURRENCY" as const, pattern: '[$R$-pt-BR] #,##0.00' };
const BRAZILIAN_DATE_FORMAT = { type: "DATE" as const, pattern: "dd/MM/yyyy" };
const PERCENTAGE_FORMAT = { type: "PERCENT" as const, pattern: "0.00%" };
const NUMBER_FORMAT = { type: "NUMBER" as const, pattern: "#,##0.00" };

/**
 * Renders each ExportDefinition as a new color-themed tab: colored tab +
 * header, frozen header row, zebra banding, aligned numbers/dates.
 */
export class GoogleSheetExporter implements ExportWriter {
  private doc?: GoogleSpreadsheet;

  constructor(
    private readonly config: GoogleSheetConfig,
    private readonly namer: SheetNamer = new SheetNamer(),
  ) {}

  async write(definition: ExportDefinition): Promise<string> {
    const doc = await this.openDoc();
    const theme = themeFor(definition.group);

    const sheet = await doc.addSheet({
      title: definition.sheetTitle ?? this.namer.name(definition.group),
      headerValues: [...definition.headers],
      tabColor: theme.header,
      gridProperties: {
        rowCount: definition.rows.length + 1,
        columnCount: definition.headers.length,
        frozenRowCount: 1,
        frozenColumnCount: 0,
      },
    });
    await sheet.addRows(definition.rows.map((row) => ({ ...row })));
    await this.applyTheme(sheet, definition, theme);

    return `https://docs.google.com/spreadsheets/d/${this.config.spreadsheetId}/edit#gid=${sheet.sheetId}`;
  }

  private async openDoc(): Promise<GoogleSpreadsheet> {
    if (this.doc) return this.doc;
    if (!this.config.spreadsheetId || !this.config.clientEmail || !this.config.privateKey) {
      throw new Error("missing Google Sheet config (update_invest_spread_sheet)");
    }
    const jwt = new JWT({
      email: this.config.clientEmail,
      key: this.config.privateKey,
      scopes: SCOPES,
    });
    this.doc = new GoogleSpreadsheet(this.config.spreadsheetId, jwt);
    await this.doc.loadInfo();
    return this.doc;
  }

  private async applyTheme(
    sheet: GoogleSpreadsheetWorksheet,
    definition: ExportDefinition,
    theme: SheetTheme,
  ): Promise<void> {
    const cols = definition.headers.length;
    const rows = definition.rows.length + 1; // + header
    await sheet.loadCells({
      startRowIndex: 0,
      endRowIndex: rows,
      startColumnIndex: 0,
      endColumnIndex: cols,
    });

    for (let c = 0; c < cols; c++) {
      const cell = sheet.getCell(0, c);
      cell.backgroundColor = theme.header;
      cell.textFormat = { bold: true, foregroundColor: WHITE };
      cell.horizontalAlignment = "CENTER";
    }

    definition.rows.forEach((row, i) => {
      const r = i + 1; // data rows start after header
      const banded = i % 2 === 1;
      definition.headers.forEach((header, c) => {
        const cell = sheet.getCell(r, c);
        if (banded) cell.backgroundColor = theme.band;
        const formula = definition.formulas?.[i]?.[header];
        if (formula) cell.formula = formula;
        const value = row[header];
        if (typeof value === "number") cell.horizontalAlignment = "RIGHT";
        if (value instanceof Date) {
          cell.horizontalAlignment = "CENTER";
          cell.numberFormat = BRAZILIAN_DATE_FORMAT;
        } else if ((typeof value === "number" || formula) && PERCENTAGE_HEADER.test(header)) {
          cell.numberFormat = PERCENTAGE_FORMAT;
        } else if ((typeof value === "number" || formula) && CURRENCY_HEADER.test(header)) {
          cell.numberFormat = BRAZILIAN_CURRENCY_FORMAT;
        } else if (typeof value === "number") {
          cell.numberFormat = NUMBER_FORMAT;
        }
      });
    });

    await sheet.saveUpdatedCells();
  }
}
