import { AssetClass } from "../../../domain/model/AssetClass";
import { PositionTable } from "../../../domain/model/PositionTable";

/** Maps one raw Status Invest export file into its canonical table. */
export interface AssetTableMapper {
  readonly assetClass: AssetClass;
  map(payload: unknown): PositionTable;
}

/** Every export wraps its records in a `data` array. */
export function records(payload: unknown, assetClass: AssetClass): Readonly<Record<string, unknown>>[] {
  const data = (payload as { data?: unknown })?.data;
  if (!Array.isArray(data)) {
    throw new Error(`the "${assetClass}" export must hold a "data" array`);
  }
  return data.filter(isRecord);
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
