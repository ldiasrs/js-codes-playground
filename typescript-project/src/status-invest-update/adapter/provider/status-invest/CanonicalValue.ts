import { CellValue, Column, ColumnKind } from "../../../domain/model/Column";
import { Position } from "../../../domain/model/Position";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/;
const BRAZILIAN_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const PERCENT_SCALE = 100;

type Raw = Readonly<Record<string, unknown>>;

/** Reads a raw provider record through the canonical columns that describe it. */
export function project(columns: readonly Column[], raw: Raw): Position {
  return Object.fromEntries(
    columns.map((column) => [column.id, coerce(raw[column.id], column.kind)]),
  );
}

function coerce(value: unknown, kind: ColumnKind): CellValue {
  if (value === null || value === undefined) return null;
  switch (kind) {
    case "identifier":
      return String(value);
    case "date":
      return toLocalDate(value);
    case "percent":
      return typeof value === "number" ? value / PERCENT_SCALE : null;
    case "money":
    case "quantity":
      return typeof value === "number" ? value : null;
    case "text":
      return String(value);
  }
}

/**
 * The same export mixes both spellings — most products date in ISO, a few
 * (`CDB LIQUIDEZ DIARIA`, `CDB PORQUINHO OBJETIVO`, `LCI PRE 180 DIAS`) in
 * `dd/MM/yyyy`. Both are read here; anything else is left empty rather than
 * guessed at.
 *
 * The date is built in local time so the day shown never slides backwards when
 * the spreadsheet's time zone is behind UTC.
 */
function toLocalDate(value: unknown): CellValue {
  if (typeof value !== "string") return null;
  const iso = ISO_DATE.exec(value);
  if (iso) return localDate(iso[1], iso[2], iso[3]);
  const brazilian = BRAZILIAN_DATE.exec(value);
  if (brazilian) return localDate(brazilian[3], brazilian[2], brazilian[1]);
  return null;
}

function localDate(year: string, month: string, day: string): Date {
  return new Date(Number(year), Number(month) - 1, Number(day));
}
