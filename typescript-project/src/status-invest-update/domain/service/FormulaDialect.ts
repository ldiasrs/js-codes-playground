/** Brazilian-locale sheets separate arguments with `;`. */
const ARGUMENT_SEPARATOR = "; ";
const BLANK = '""';

/**
 * How a formula is spelled for the target spreadsheet. Every formula is built
 * through here, so the argument separator is one decision in one place rather
 * than a comma hardcoded at each call site.
 */
export class FormulaDialect {
  constructor(private readonly argumentSeparator: string = ARGUMENT_SEPARATOR) {}

  /** Prefixes `=`, making the expression ready for a cell. */
  cell(expression: string): string {
    return `=${expression}`;
  }

  call(name: string, ...args: string[]): string {
    return `${name}(${args.join(this.argumentSeparator)})`;
  }

  /** Reads as blank rather than #DIV/0! or #NUM!. */
  orBlank(expression: string): string {
    return this.call("IFERROR", expression, BLANK);
  }

  /** Leaves the cell blank when the one it depends on is empty. */
  whenPresent(cellReference: string, expression: string): string {
    return this.call("IF", `${cellReference}=${BLANK}`, BLANK, expression);
  }

  date(value: Date): string {
    return this.call(
      "DATE",
      String(value.getFullYear()),
      String(value.getMonth() + 1),
      String(value.getDate()),
    );
  }
}
