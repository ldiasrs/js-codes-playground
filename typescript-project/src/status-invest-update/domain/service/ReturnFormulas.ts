import { AssetClassContract, basisFor } from "../model/AssetClassContract";
import { Position } from "../model/Position";
import { ReturnBasis } from "../model/ReturnBasis";
import { ColumnReference } from "./ColumnReference";
import { FormulaDialect } from "./FormulaDialect";

const DAYS_IN_YEAR = 365;
const MONTHS_IN_YEAR = 12;

/**
 * Writes the profit columns as spreadsheet formulas, so every number stays
 * auditable and recalculates in the sheet instead of arriving pre-computed.
 *
 * Which columns a row gets, and what they read, comes from the asset class
 * contract — including any per-product override, such as a daily-liquidity CDB
 * whose return has to net off what was already withdrawn.
 */
export class ReturnFormulas {
  constructor(
    private readonly takenAt: Date,
    private readonly dialect: FormulaDialect = new FormulaDialect(),
  ) {}

  forRow(
    contract: AssetClassContract,
    columns: ColumnReference,
    position: Position,
    row: number,
  ): Readonly<Record<string, string>> {
    const { headline, monthly } = contract.returnColumns;
    const formulas: Record<string, string> = {
      [headline.id]: this.headline(basisFor(contract, position), columns, row),
    };
    if (monthly) formulas[monthly.id] = this.monthly(columns, headline.id, row);
    return formulas;
  }

  private headline(basis: ReturnBasis, columns: ColumnReference, row: number): string {
    const growth = `(${columns.cell(basis.currentColumn, row)}/${this.invested(basis, columns, row)})`;
    if (!basis.startDateColumn) {
      return this.dialect.cell(this.dialect.orBlank(`${growth}-1`));
    }
    const startDate = columns.cell(basis.startDateColumn, row);
    const daysHeld = `(${this.dialect.date(this.takenAt)}-${startDate})`;
    return this.dialect.cell(
      this.dialect.whenPresent(
        startDate,
        this.dialect.orBlank(`${growth}^(${DAYS_IN_YEAR}/${daysHeld})-1`),
      ),
    );
  }

  /** What is still invested: the operation less anything already taken back out. */
  private invested(basis: ReturnBasis, columns: ColumnReference, row: number): string {
    const invested = columns.cell(basis.investedColumn, row);
    if (!basis.withdrawnColumn) return invested;
    return `(${invested}-${columns.cell(basis.withdrawnColumn, row)})`;
  }

  /** A twelfth of the headline, so the two columns can never disagree. */
  private monthly(columns: ColumnReference, headlineId: string, row: number): string {
    const headline = columns.cell(headlineId, row);
    return this.dialect.cell(
      this.dialect.whenPresent(headline, `${headline}/${MONTHS_IN_YEAR}`),
    );
  }
}
