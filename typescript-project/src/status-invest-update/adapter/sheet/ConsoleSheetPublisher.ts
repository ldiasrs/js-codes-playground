import { SheetPublisher } from "../../application/port/SheetPublisher";
import { CellValue } from "../../domain/model/Column";
import { PublishedSheet, SheetDefinition } from "../../domain/model/SheetDefinition";
import { pad2 } from "../../domain/service/formatting";

const SEPARATOR = " | ";
const PREVIEW_ROWS = 5;

/**
 * Prints what would be published, so formulas and normalisation can be checked
 * without touching the spreadsheet. Formulas are shown as written, not evaluated.
 */
export class ConsoleSheetPublisher implements SheetPublisher {
  constructor(private readonly log: (line: string) => void = console.log) {}

  async publish(definition: SheetDefinition): Promise<PublishedSheet> {
    this.log(`\n# ${definition.title} (${definition.rows.length} rows)`);
    this.log(definition.columns.map((column) => column.id).join(SEPARATOR));

    definition.rows.slice(0, PREVIEW_ROWS).forEach((row, index) => {
      this.log(
        definition.columns
          .map((column) => definition.formulas[index]?.[column.id] ?? render(row[column.id]))
          .join(SEPARATOR),
      );
    });
    if (definition.rows.length > PREVIEW_ROWS) {
      this.log(`... ${definition.rows.length - PREVIEW_ROWS} more rows`);
    }

    return { title: definition.title, rowCount: definition.rows.length, url: "(dry run)" };
  }
}

function render(value: CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    return `${pad2(value.getDate())}/${pad2(value.getMonth() + 1)}/${value.getFullYear()}`;
  }
  return String(value);
}
