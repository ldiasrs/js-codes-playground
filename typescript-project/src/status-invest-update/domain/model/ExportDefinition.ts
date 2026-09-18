export type ExportRow = Record<string, string | number | Date>;

/**
 * Technology-neutral output contract: a named group of tabular data.
 * How/where it is rendered (spreadsheet tab, CSV file, ...) is an adapter concern.
 */
export interface ExportDefinition {
  readonly group: string;
  /** Optional explicit tab title. When omitted, the exporter creates its usual timestamped name. */
  readonly sheetTitle?: string;
  readonly headers: readonly string[];
  readonly rows: readonly ExportRow[];
  /** Spreadsheet formulas, keyed by column header, for each data row. */
  readonly formulas?: readonly Record<string, string>[];
}
