import { FIELD_DEFINITIONS, FieldKey } from "../../domain/model/FieldDefinition";
import { FieldStatus } from "../../domain/model/FieldStatus";
import { StockField } from "../../domain/model/StockAnalysis";
import { FieldScorer } from "../../domain/service/FieldScorer";

/** Realistic, non-secret browser headers — reduce Cloudflare/anti-bot challenges on scrapes. */
export const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  "sec-ch-ua": '"Google Chrome";v="149", "Chromium";v="149", "Not)A;Brand";v="24"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

/** GET + JSON with a clear error, shared by the finance-API adapters. */
export async function getJson(url: string, label: string): Promise<any> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${label} ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

/** Every field defaulted to N/A; adapters fill what the source provides. */
export function emptyFields(): Record<FieldKey, StockField> {
  const fields = {} as Record<FieldKey, StockField>;
  for (const def of FIELD_DEFINITIONS) fields[def.key] = { value: "N/A", status: "na" };
  return fields;
}

export const toNumber = (v: unknown): number => (v === null || v === undefined ? NaN : Number(v));
export const isNum = (v: unknown): boolean => Number.isFinite(toNumber(v));

/** A fraction (0.042) shown as a percent string ("4.20%"). */
export const pctDisplay = (fraction: number): string => `${(fraction * 100).toFixed(2)}%`;
export const ratioDisplay = (v: number): string => v.toFixed(2);

/** Sets a scored field: stores the raw number, a display string, and a graded status. */
export function setScored(
  fields: Record<FieldKey, StockField>,
  scorer: FieldScorer,
  key: FieldKey,
  numeric: number,
  display: string,
): void {
  if (!Number.isFinite(numeric)) return;
  fields[key] = { value: display, numeric, status: scorer.statusFromScore(scorer.score(key, numeric)) };
}

/** Sets a display-only field (kept as N/A status — not part of the score). */
export function setDisplay(
  fields: Record<FieldKey, StockField>,
  key: FieldKey,
  numeric: number,
  display: string,
): void {
  if (!Number.isFinite(numeric)) return;
  fields[key] = { value: display, numeric, status: "na" };
}

/** Overall = good if all known are good, weak if half-or-more are weak, else caution. */
export function overallFrom(fields: Record<FieldKey, StockField>): FieldStatus {
  const known = Object.values(fields)
    .map((f) => f.status)
    .filter((s) => s !== "na");
  if (!known.length) return "na";
  if (known.every((s) => s === "good")) return "good";
  const weak = known.filter((s) => s === "weak").length;
  return weak * 2 >= known.length ? "weak" : "caution";
}
