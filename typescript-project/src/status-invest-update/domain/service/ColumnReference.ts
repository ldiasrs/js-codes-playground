import { Column } from "../model/Column";

const ALPHABET_SIZE = 26;
const FIRST_DATA_ROW = 2; // row 1 holds the headers

/** Resolves column ids to A1 notation, so formulas never hardcode a letter. */
export class ColumnReference {
  private readonly letters: Map<string, string>;

  constructor(columns: readonly Column[]) {
    this.letters = new Map(columns.map((column, index) => [column.id, toLetter(index)]));
  }

  letter(columnId: string): string {
    const letter = this.letters.get(columnId);
    if (!letter) throw new Error(`no column "${columnId}" to reference in a formula`);
    return letter;
  }

  cell(columnId: string, row: number): string {
    return `${this.letter(columnId)}${row}`;
  }

  /** The whole data column, open-ended so added rows are included. */
  dataRange(columnId: string): string {
    const letter = this.letter(columnId);
    return `${letter}${FIRST_DATA_ROW}:${letter}`;
  }
}

function toLetter(index: number): string {
  let remaining = index + 1;
  let letter = "";
  while (remaining > 0) {
    const position = (remaining - 1) % ALPHABET_SIZE;
    letter = String.fromCharCode(65 + position) + letter;
    remaining = Math.floor((remaining - 1) / ALPHABET_SIZE);
  }
  return letter;
}
