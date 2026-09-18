import { AssetClassContract, contractFor } from "../model/AssetClassContract";
import { Position } from "../model/Position";
import { PositionTable } from "../model/PositionTable";
import { columnsOf } from "../model/ReturnColumns";
import { SheetDefinition } from "../model/SheetDefinition";
import { ColumnReference } from "./ColumnReference";
import { PositionReturn } from "./PositionReturn";
import { ReturnFormulas } from "./ReturnFormulas";
import { SheetTitle } from "./SheetTitle";

const FIRST_DATA_ROW = 2;

/**
 * Turns one asset class's positions into a tab led by its profit columns, worst
 * return first. Rows are ordered before the formulas are written, because each
 * formula addresses the row it sits on.
 */
export class InvestmentSheetFactory {
  constructor(
    private readonly returnFormulas: ReturnFormulas,
    private readonly positionReturn: PositionReturn,
    private readonly title: SheetTitle,
  ) {}

  build(table: PositionTable): SheetDefinition {
    const contract = contractFor(table.assetClass);
    const columns = [...columnsOf(contract.returnColumns), ...table.columns];
    const reference = new ColumnReference(columns);
    const positions = this.ascendingByReturn(contract, table.positions);

    return {
      title: this.title.for(table.assetClass),
      columns,
      rows: positions,
      formulas: positions.map((position, index) =>
        this.returnFormulas.forRow(contract, reference, position, index + FIRST_DATA_ROW),
      ),
    };
  }

  /** Positions whose return reads blank have nothing to rank, so they go last. */
  private ascendingByReturn(
    contract: AssetClassContract,
    positions: readonly Position[],
  ): Position[] {
    return [...positions].sort((left, right) => {
      const leftReturn = this.positionReturn.of(contract, left);
      const rightReturn = this.positionReturn.of(contract, right);
      if (leftReturn === null) return rightReturn === null ? 0 : 1;
      if (rightReturn === null) return -1;
      return leftReturn - rightReturn;
    });
  }
}
