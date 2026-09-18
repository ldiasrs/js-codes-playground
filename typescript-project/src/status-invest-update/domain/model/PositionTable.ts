import { AssetClass } from "./AssetClass";
import { allBasesOf, contractFor } from "./AssetClassContract";
import { Column, ColumnKind } from "./Column";
import { Position } from "./Position";
import { ReturnBasis } from "./ReturnBasis";

/** One provider's positions for one asset class, already in canonical columns. */
export interface PositionTable {
  readonly assetClass: AssetClass;
  readonly columns: readonly Column[];
  readonly positions: readonly Position[];
}

const BASIS_KINDS: Record<keyof ReturnBasis, ColumnKind> = {
  investedColumn: "money",
  currentColumn: "money",
  withdrawnColumn: "money",
  startDateColumn: "date",
};

/**
 * Builds a table only if it honours its asset class contract, so a provider
 * that forgets a column fails here rather than producing a tab of `#REF!`
 * formulas.
 */
export function createPositionTable(
  assetClass: AssetClass,
  columns: readonly Column[],
  positions: readonly Position[],
): PositionTable {
  const contract = contractFor(assetClass);
  for (const basis of allBasesOf(contract)) {
    for (const [role, kind] of Object.entries(BASIS_KINDS)) {
      requireColumn(columns, assetClass, basis[role as keyof ReturnBasis], role, kind);
    }
  }
  for (const override of contract.basisOverrides) {
    requireColumn(columns, assetClass, override.whenColumn, "override condition");
  }
  return { assetClass, columns, positions };
}

function requireColumn(
  columns: readonly Column[],
  assetClass: AssetClass,
  columnId: string | undefined,
  role: string,
  kind?: ColumnKind,
): void {
  if (!columnId) return;
  const column = columns.find((candidate) => candidate.id === columnId);
  if (!column) throw new Error(`"${assetClass}" is missing its ${role} "${columnId}"`);
  if (kind && column.kind !== kind) {
    throw new Error(`"${assetClass}" column "${columnId}" must be ${kind}, got ${column.kind}`);
  }
}

