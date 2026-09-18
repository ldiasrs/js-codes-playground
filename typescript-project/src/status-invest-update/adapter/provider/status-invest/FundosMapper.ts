import { Column } from "../../../domain/model/Column";
import { createPositionTable, PositionTable } from "../../../domain/model/PositionTable";
import { AssetTableMapper, records } from "./AssetTableMapper";
import { project } from "./CanonicalValue";

const COLUMNS: readonly Column[] = [
  { id: "produto", kind: "text" },
  { id: "dataCotacao", kind: "date" },
  { id: "quantidadeCotas", kind: "quantity" },
  { id: "valorCota", kind: "money" },
  { id: "valorNominal", kind: "money" },
  { id: "valorBruto", kind: "money" },
  { id: "irPrevisto", kind: "money" },
  { id: "iofPrevisto", kind: "money" },
  { id: "valorLiquido", kind: "money" },
  { id: "percentualRetorno", kind: "percent" },
];

/**
 * Investment funds: one row per fund. `dataCotacao` is the date the quota was
 * priced, not the date the fund was bought, so these returns cannot be
 * compounded over a holding period.
 */
export class FundosMapper implements AssetTableMapper {
  readonly assetClass = "fundos" as const;

  map(payload: unknown): PositionTable {
    const positions = records(payload, this.assetClass).map((raw) => project(COLUMNS, raw));
    return createPositionTable(this.assetClass, COLUMNS, positions);
  }
}
