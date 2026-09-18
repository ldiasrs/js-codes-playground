import { Column } from "../../../domain/model/Column";
import { createPositionTable, PositionTable } from "../../../domain/model/PositionTable";
import { AssetTableMapper, records } from "./AssetTableMapper";
import { project } from "./CanonicalValue";

const COLUMNS: readonly Column[] = [
  { id: "codPapel", kind: "identifier" },
  { id: "qtdeDisp", kind: "quantity" },
  { id: "precoMedio", kind: "money" },
  { id: "precoMercado", kind: "money" },
  { id: "custoMedio", kind: "money" },
  { id: "valorMercado", kind: "money" },
  { id: "valorRetorno", kind: "money" },
  { id: "percentualRetorno", kind: "percent" },
];

/** Brazilian shares, BDRs and listed funds: one row per ticker held. */
export class AcoesBrMapper implements AssetTableMapper {
  readonly assetClass = "acoes-br" as const;

  map(payload: unknown): PositionTable {
    const positions = records(payload, this.assetClass).map((raw) => project(COLUMNS, raw));
    return createPositionTable(this.assetClass, COLUMNS, positions);
  }
}
