export type ExportRow = Record<string, string | number>;

/**
 * Technology-neutral output contract: a named group of tabular data.
 * How/where it is rendered (spreadsheet tab, CSV file, ...) is an adapter concern.
 */
export interface ExportDefinition {
  readonly group: string;
  readonly headers: readonly string[];
  readonly rows: readonly ExportRow[];
}
