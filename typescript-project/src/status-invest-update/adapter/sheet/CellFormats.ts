import { ColumnKind } from "../../domain/model/Column";

export type HorizontalAlignment = "LEFT" | "CENTER" | "RIGHT";

export interface NumberFormat {
  readonly type: "CURRENCY" | "DATE" | "PERCENT" | "NUMBER" | "TEXT";
  readonly pattern: string;
}

export interface CellFormat {
  readonly numberFormat: NumberFormat;
  readonly horizontalAlignment: HorizontalAlignment;
}

/**
 * Brazilian presentation for every canonical column kind: `R$` money with a
 * comma decimal separator, `dd/MM/yyyy` dates, and note numbers as text so the
 * sheet never reformats them into scientific notation.
 */
const FORMATS: Record<ColumnKind, CellFormat> = {
  text: { numberFormat: { type: "TEXT", pattern: "@" }, horizontalAlignment: "LEFT" },
  identifier: { numberFormat: { type: "TEXT", pattern: "@" }, horizontalAlignment: "LEFT" },
  quantity: { numberFormat: { type: "NUMBER", pattern: "#,##0.00######" }, horizontalAlignment: "RIGHT" },
  money: { numberFormat: { type: "CURRENCY", pattern: '[$R$ -pt-BR]#,##0.00' }, horizontalAlignment: "RIGHT" },
  date: { numberFormat: { type: "DATE", pattern: "dd/MM/yyyy" }, horizontalAlignment: "CENTER" },
  percent: { numberFormat: { type: "PERCENT", pattern: "0.00%" }, horizontalAlignment: "RIGHT" },
};

export function formatFor(kind: ColumnKind): CellFormat {
  return FORMATS[kind];
}
