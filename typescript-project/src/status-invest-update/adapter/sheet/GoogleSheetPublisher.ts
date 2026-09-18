import { JWT } from "google-auth-library";
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import { SheetPublisher } from "../../application/port/SheetPublisher";
import { CellValue } from "../../domain/model/Column";
import { PublishedSheet, SheetDefinition } from "../../domain/model/SheetDefinition";
import { GoogleSheetCredentials } from "../config/SnapshotConfig";
import { formatFor } from "./CellFormats";
import { toSerialDate } from "./SerialDate";
import { SheetTheme, themeFor, WHITE } from "./sheetThemes";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

const HEADER_ROW = 0;
const FIRST_DATA_ROW = 1;

/** Writes each sheet definition as a new themed tab in the configured document. */
export class GoogleSheetPublisher implements SheetPublisher {
  private document?: GoogleSpreadsheet;

  constructor(private readonly credentials: GoogleSheetCredentials) {}

  async publish(definition: SheetDefinition): Promise<PublishedSheet> {
    const document = await this.open();
    const theme = themeFor(definition.title);

    const sheet = await document.addSheet({
      title: definition.title,
      headerValues: definition.columns.map((column) => column.id),
      tabColor: theme.header,
      gridProperties: {
        rowCount: definition.rows.length + 1,
        columnCount: definition.columns.length,
        frozenRowCount: 1,
      },
    });
    await this.fill(sheet, definition, theme);

    return {
      title: definition.title,
      rowCount: definition.rows.length,
      url: `https://docs.google.com/spreadsheets/d/${this.credentials.spreadsheetId}/edit#gid=${sheet.sheetId}`,
    };
  }

  private async open(): Promise<GoogleSpreadsheet> {
    if (this.document) return this.document;
    const jwt = new JWT({
      email: this.credentials.clientEmail,
      key: this.credentials.privateKey,
      scopes: SCOPES,
    });
    this.document = new GoogleSpreadsheet(this.credentials.spreadsheetId, jwt);
    await this.document.loadInfo();
    return this.document;
  }

  private async fill(
    sheet: GoogleSpreadsheetWorksheet,
    definition: SheetDefinition,
    theme: SheetTheme,
  ): Promise<void> {
    await sheet.loadCells({
      startRowIndex: HEADER_ROW,
      endRowIndex: definition.rows.length + 1,
      startColumnIndex: 0,
      endColumnIndex: definition.columns.length,
    });

    definition.columns.forEach((column, columnIndex) => {
      const header = sheet.getCell(HEADER_ROW, columnIndex);
      header.backgroundColor = theme.header;
      header.textFormat = { bold: true, foregroundColor: WHITE };
      header.horizontalAlignment = "CENTER";
    });

    definition.rows.forEach((row, rowIndex) => {
      const isBanded = rowIndex % 2 === 1;
      definition.columns.forEach((column, columnIndex) => {
        const cell = sheet.getCell(rowIndex + FIRST_DATA_ROW, columnIndex);
        const format = formatFor(column.kind);
        if (isBanded) cell.backgroundColor = theme.band;
        cell.horizontalAlignment = format.horizontalAlignment;
        cell.numberFormat = format.numberFormat;

        const formula = definition.formulas[rowIndex]?.[column.id];
        if (formula) {
          cell.formula = formula;
          return;
        }
        const value = toCellInput(row[column.id]);
        if (value !== null) cell.value = value;
      });
    });

    await sheet.saveUpdatedCells();
  }
}

function toCellInput(value: CellValue): string | number | null {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? toSerialDate(value) : value;
}
