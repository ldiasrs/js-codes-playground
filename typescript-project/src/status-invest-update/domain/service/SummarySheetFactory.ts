import { AssetClass } from "../model/AssetClass";
import { contractFor } from "../model/AssetClassContract";
import { Column } from "../model/Column";
import { TOTAL_RETURN } from "../model/ReturnColumns";
import { SheetDefinition } from "../model/SheetDefinition";
import { ColumnReference } from "./ColumnReference";
import { FormulaDialect } from "./FormulaDialect";
import { SheetTitle } from "./SheetTitle";

export const SUMMARY_NAME = "resumo";

const CATEGORY = "categoria";
const INVESTED = "valor-investido";
const CURRENT = "valor-atual";
const TOTAL_LABEL = "Total";

const SUMMARY_COLUMNS: readonly Column[] = [
  { id: CATEGORY, kind: "text" },
  { id: INVESTED, kind: "money" },
  { id: CURRENT, kind: "money" },
  { id: TOTAL_RETURN, kind: "percent" },
];

const FIRST_DATA_ROW = 2;

/** One published investment tab, as the summary needs to see it. */
export interface SummarySource {
  readonly assetClass: AssetClass;
  readonly title: string;
  readonly columns: readonly Column[];
}

/**
 * Consolidates the investment tabs into a `resumo` tab of cross-tab formulas:
 * every figure traces back to the tab it came from and follows any edit there.
 *
 * The return is stated as `%-total` rather than annualised, because the
 * positions behind one category were bought on different dates and there is no
 * single holding period to compound over.
 */
export class SummarySheetFactory {
  constructor(
    private readonly title: SheetTitle,
    private readonly dialect: FormulaDialect = new FormulaDialect(),
  ) {}

  build(sources: readonly SummarySource[]): SheetDefinition {
    const reference = new ColumnReference(SUMMARY_COLUMNS);

    return {
      title: this.title.for(SUMMARY_NAME),
      columns: SUMMARY_COLUMNS,
      rows: [
        ...sources.map((source) => ({ [CATEGORY]: contractFor(source.assetClass).label })),
        { [CATEGORY]: TOTAL_LABEL },
      ],
      formulas: [
        ...sources.map((source, index) =>
          this.categoryRow(source, reference, index + FIRST_DATA_ROW),
        ),
        this.totalRow(reference, sources.length),
      ],
    };
  }

  private categoryRow(
    source: SummarySource,
    reference: ColumnReference,
    row: number,
  ): Readonly<Record<string, string>> {
    const sourceReference = new ColumnReference(source.columns);
    const { returnBasis } = contractFor(source.assetClass);
    const sum = (columnId: string) =>
      this.dialect.cell(
        this.dialect.call("SUM", `'${source.title}'!${sourceReference.dataRange(columnId)}`),
      );

    return {
      [INVESTED]: sum(returnBasis.investedColumn),
      [CURRENT]: sum(returnBasis.currentColumn),
      ...this.returnFormula(reference, row),
    };
  }

  private totalRow(
    reference: ColumnReference,
    categoryCount: number,
  ): Readonly<Record<string, string>> {
    const lastCategoryRow = FIRST_DATA_ROW + categoryCount - 1;
    const total = (columnId: string) =>
      this.dialect.cell(
        this.dialect.call(
          "SUM",
          `${reference.cell(columnId, FIRST_DATA_ROW)}:${reference.cell(columnId, lastCategoryRow)}`,
        ),
      );

    return {
      [INVESTED]: total(INVESTED),
      [CURRENT]: total(CURRENT),
      ...this.returnFormula(reference, FIRST_DATA_ROW + categoryCount),
    };
  }

  private returnFormula(
    reference: ColumnReference,
    row: number,
  ): Readonly<Record<string, string>> {
    const growth = `(${reference.cell(CURRENT, row)}/${reference.cell(INVESTED, row)})`;
    return { [TOTAL_RETURN]: this.dialect.cell(this.dialect.orBlank(`${growth}-1`)) };
  }
}
