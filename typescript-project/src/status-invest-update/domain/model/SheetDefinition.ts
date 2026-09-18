import { CellValue, Column } from "./Column";

export type SheetRow = Readonly<Record<string, CellValue>>;

/**
 * Technology-neutral output contract: a titled table whose cells are either
 * values or spreadsheet formulas. Where it lands is an adapter's concern.
 */
export interface SheetDefinition {
  readonly title: string;
  readonly columns: readonly Column[];
  readonly rows: readonly SheetRow[];
  /** One entry per row, keyed by column id. A formula wins over the row value. */
  readonly formulas: readonly Readonly<Record<string, string>>[];
}

export interface PublishedSheet {
  readonly title: string;
  readonly rowCount: number;
  readonly url: string;
}
