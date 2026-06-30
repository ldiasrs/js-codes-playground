import { FIELD_DEFINITIONS, FIELD_GROUPS, FieldKey } from "../../domain/model/FieldDefinition";
import { FieldStatus } from "../../domain/model/FieldStatus";
import { marketLabel } from "../../domain/model/Market";
import { AnalysisResult, StockAnalysis, StockField, isFailed } from "../../domain/model/StockAnalysis";
import { PILLAR_ORDER, StockRanker } from "../../domain/service/StockRanker";

/** Fixed summary columns shown before the indicator columns. */
export const SUMMARY_HEADERS = [
  "#",
  "Ticker",
  "Company",
  "Market",
  "Cur",
  "FSS",
  "Overall",
  "Prof",
  "Debt",
  "Val",
  "Grw",
  "Eff",
  "Sector",
] as const;

const PILLAR_ABBREV: Record<string, string> = {
  profitability: "Prof",
  debt: "Debt",
  valuation: "Val",
  growth: "Grw",
  efficiency: "Eff",
};

/** Indicator columns, in report group order (Profitability → … → Valuation). */
export function fieldColumns(): { key: FieldKey; header: string }[] {
  return FIELD_GROUPS.flatMap((g) =>
    FIELD_DEFINITIONS.filter((d) => d.group === g.group).map((d) => ({
      key: d.key,
      header: `${d.labelEn} (${d.labelPt})`,
    })),
  );
}

/** Field status from the configured scored-set (graded when scored+numeric, else stored). */
export function fieldStatusOf(ranker: StockRanker, key: FieldKey, f?: StockField): FieldStatus {
  if (f && f.numeric !== undefined && ranker.isScored(key)) {
    const sc = ranker.fieldScore(key, f.numeric);
    if (Number.isFinite(sc)) return ranker.statusFromScore(sc);
  }
  return f?.status ?? "na";
}

export function overallOf(ranker: StockRanker, s: StockAnalysis): FieldStatus {
  const statuses = FIELD_DEFINITIONS.map((d) => fieldStatusOf(ranker, d.key, s.fields[d.key])).filter(
    (st) => st !== "na",
  );
  if (!statuses.length) return "na";
  if (statuses.every((st) => st === "good")) return "good";
  const weak = statuses.filter((st) => st === "weak").length;
  return weak * 2 >= statuses.length ? "weak" : "caution";
}

export interface SheetRowMeta {
  readonly analysis: StockAnalysis;
  readonly fss: number;
  /** 0–100 per pillar (null when no data), in PILLAR_ORDER. */
  readonly pillars: (number | null)[];
}

export interface SheetModel {
  readonly headers: string[];
  readonly rows: Record<string, string | number>[];
  readonly fields: { key: FieldKey; header: string }[];
  /** Per data row (best-first), parallel to rows — for coloring. */
  readonly meta: SheetRowMeta[];
}

/** Bilingual (EN + pt-BR) index columns, in this order. */
export const INDEX_HEADERS = [
  "Group (Grupo)",
  "Indicator (EN)",
  "Indicador (PT)",
  "Meaning (EN)",
  "Significado (PT)",
  "Example (EN)",
  "Exemplo (PT)",
  "Scored (Pontua)",
] as const;

export interface IndexSheet {
  readonly headers: string[];
  readonly rows: Record<string, string>[];
  /** Group label per row (parallel to rows) — for shading. */
  readonly groups: string[];
}

/**
 * Pure: the standalone bilingual indicator index — one row per indicator with English
 * and pt-BR name, meaning and example, plus whether it feeds the score.
 */
export function buildIndexSheet(ranker: StockRanker): IndexSheet {
  const rows: Record<string, string>[] = [];
  const groups: string[] = [];
  for (const g of FIELD_GROUPS) {
    const groupLabel = `${g.labelEn} · ${g.labelPt}`;
    for (const d of FIELD_DEFINITIONS.filter((x) => x.group === g.group)) {
      rows.push({
        "Group (Grupo)": groupLabel,
        "Indicator (EN)": d.labelEn,
        "Indicador (PT)": d.labelPt,
        "Meaning (EN)": d.meaning,
        "Significado (PT)": d.meaningPt,
        "Example (EN)": d.example,
        "Exemplo (PT)": d.examplePt,
        "Scored (Pontua)": ranker.isScored(d.key) ? "✓" : "",
      });
      groups.push(groupLabel);
    }
  }
  return { headers: [...INDEX_HEADERS], rows, groups };
}

/**
 * Pure: turns results into the sheet's headers + rows (best-FSS first, rank 1 = strongest),
 * plus per-row metadata used to color cells. Failed/uncached tickers are excluded.
 */
export function buildSheetModel(results: AnalysisResult[], ranker: StockRanker): SheetModel {
  const analyses = results.filter((r): r is StockAnalysis => !isFailed(r));
  const bestFirst = ranker.rank(analyses).reverse(); // rank() is weakest-first
  const fields = fieldColumns();
  const headers = [...SUMMARY_HEADERS, ...fields.map((f) => f.header)];

  const rows: Record<string, string | number>[] = [];
  const meta: SheetRowMeta[] = [];

  bestFirst.forEach((entry, index) => {
    const s = entry.analysis;
    const pillars = ranker.breakdown(s).map((b) => (b.score === null ? null : Math.round(b.score * 100)));
    const overall = overallOf(ranker, s);

    const row: Record<string, string | number> = {
      "#": index + 1,
      Ticker: s.ticker,
      Company: s.company,
      Market: marketLabel(s.market),
      Cur: s.currency,
      FSS: entry.score,
      Overall: overall.toUpperCase(),
      Sector: s.sector,
    };
    PILLAR_ORDER.forEach((p, i) => {
      row[PILLAR_ABBREV[p]] = pillars[i] === null ? "" : (pillars[i] as number);
    });
    for (const { key, header } of fields) {
      row[header] = s.fields[key]?.value ?? "N/A";
    }

    rows.push(row);
    meta.push({ analysis: s, fss: entry.score, pillars });
  });

  return { headers, rows, fields, meta };
}
