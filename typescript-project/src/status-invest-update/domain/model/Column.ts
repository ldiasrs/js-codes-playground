/**
 * How a column is meant to be read. Adapters turn this into presentation
 * (Brazilian currency, `dd/MM/yyyy`, percent, plain text), so no layer above
 * the adapter needs to know about spreadsheet number formats.
 */
export type ColumnKind =
  | "text"
  /** Codes and note numbers: digits that must never be read as a quantity. */
  | "identifier"
  | "quantity"
  | "money"
  | "date"
  /** A fraction of 1: `0.1545` displayed as `15,45%`. */
  | "percent";

export interface Column {
  /** Also the header text written to the sheet. */
  readonly id: string;
  readonly kind: ColumnKind;
}

export type CellValue = string | number | Date | null;
