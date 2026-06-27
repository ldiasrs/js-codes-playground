import { FIELD_DEFINITIONS, FieldKey } from "../model/FieldDefinition";
import { normalizeStatus } from "../model/FieldStatus";
import { marketCurrency } from "../model/Market";
import { Stock } from "../model/Stock";
import { StockAnalysis, StockField } from "../model/StockAnalysis";
import { normalizeProfiles } from "../model/StockProfile";

/**
 * Parses raw LLM text into a validated StockAnalysis. Tolerates markdown fences and
 * surrounding prose by extracting the first JSON object. Every field defined in
 * FIELD_DEFINITIONS is guaranteed present (missing → N/A). Captures a numeric value
 * (from `numeric` or parsed from `value`) so the FSS can score LLM output too.
 */
export class StockAnalysisParser {
  parse(raw: string, stock: Stock): StockAnalysis {
    const data = this.extractJson(raw);

    const fields = {} as Record<FieldKey, StockField>;
    for (const def of FIELD_DEFINITIONS) {
      const f = (data.fields ?? {})[def.key] ?? {};
      const numeric = this.num(f);
      fields[def.key] = {
        value: this.text(f.value, "N/A"),
        ...(numeric === undefined ? {} : { numeric }),
        status: normalizeStatus(f.status),
      };
    }

    return {
      kind: "analysis",
      ticker: this.text(data.ticker, stock.ticker),
      company: this.text(data.company, ""),
      market: data.market === "US" || data.market === "BR" ? data.market : stock.market,
      currency: this.text(data.currency, marketCurrency(stock.market)),
      sector: this.text(data.sector, "—"),
      profiles: normalizeProfiles(data.profiles),
      fields,
      verdict: this.text(data.verdict, "—"),
      overall: normalizeStatus(data.overall),
    };
  }

  private extractJson(raw: string): any {
    const trimmed = (raw ?? "").trim();
    if (!trimmed) throw new Error("empty LLM response");
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("no JSON object found in LLM response");
    }
    return JSON.parse(trimmed.slice(start, end + 1));
  }

  /** Numeric from `numeric`, else parsed from the `value` string (US-style). */
  private num(f: any): number | undefined {
    if (typeof f?.numeric === "number" && Number.isFinite(f.numeric)) return f.numeric;
    const cleaned = String(f?.value ?? "").replace(/[^0-9.,\-]/g, "");
    if (!cleaned) return undefined;
    const norm = cleaned.includes(".") ? cleaned.replace(/,/g, "") : cleaned.replace(",", ".");
    const n = parseFloat(norm);
    return Number.isFinite(n) ? n : undefined;
  }

  private text(value: unknown, fallback: string): string {
    if (value === null || value === undefined || value === "") return fallback;
    return String(value);
  }
}
