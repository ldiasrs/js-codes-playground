import { Column } from "../../../domain/model/Column";
import { Position } from "../../../domain/model/Position";
import { createPositionTable, PositionTable } from "../../../domain/model/PositionTable";
import { AssetTableMapper, records } from "./AssetTableMapper";
import { project } from "./CanonicalValue";

const PRODUCT_COLUMNS: readonly Column[] = [
  { id: "produto", kind: "text" },
  { id: "mercado", kind: "text" },
];

const NOTE_COLUMNS: readonly Column[] = [
  { id: "tipo", kind: "text" },
  { id: "numeroNota", kind: "identifier" },
  { id: "indexador", kind: "text" },
  { id: "dataOperacao", kind: "date" },
  { id: "dataVencimento", kind: "date" },
  { id: "valorOperacao", kind: "money" },
  { id: "valorBruto", kind: "money" },
  { id: "valorRendimento", kind: "money" },
  { id: "valorRetirada", kind: "money" },
  { id: "valorDesconto", kind: "money" },
  { id: "valorPrevisaoDesconto", kind: "money" },
  { id: "previsaoIR", kind: "money" },
  { id: "valorLiquido", kind: "money" },
];

const COLUMNS: readonly Column[] = [...PRODUCT_COLUMNS, ...NOTE_COLUMNS];

/**
 * Fixed income, flattened to one row per note so each note keeps its own
 * operation date and can be compounded over the period it was actually held.
 *
 * The product-level totals (`valorAplicadoTotal` and friends) are deliberately
 * left out: repeated across a product's notes they would double-count under a
 * column sum. Sum the per-note `valorOperacao` and `valorBruto` instead.
 */
export class RendaFixaMapper implements AssetTableMapper {
  readonly assetClass = "renda-fixa" as const;

  map(payload: unknown): PositionTable {
    const positions = records(payload, this.assetClass).flatMap((raw) => this.notesOf(raw));
    return createPositionTable(this.assetClass, COLUMNS, positions);
  }

  private notesOf(raw: Readonly<Record<string, unknown>>): Position[] {
    const product = project(PRODUCT_COLUMNS, raw);
    const notes = Array.isArray(raw.notas) ? raw.notas : [];
    return notes.map((note) => ({ ...product, ...project(NOTE_COLUMNS, note ?? {}) }));
  }
}
