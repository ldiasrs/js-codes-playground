import { StockAnalyzer } from "../../application/port/StockAnalyzer";
import { Stock } from "../../domain/model/Stock";
import { StockAnalysis } from "../../domain/model/StockAnalysis";
import { StockProfile } from "../../domain/model/StockProfile";
import { FieldScorer } from "../../domain/service/FieldScorer";
import { emptyFields, overallFrom, pctDisplay, ratioDisplay, setDisplay, setScored, toNumber } from "./financeApiSupport";

const BASE = "https://brapi.dev/api/quote";
const RICH_MODULES = "summaryProfile,defaultKeyStatistics,financialData,summaryDetail";
const FREE_MODULES = "summaryProfile";

/**
 * Brazil source (alternate): brapi.dev. The basic quote (free) yields P/E; PRO modules
 * add the rest. Degrades gracefully when modules 403 on the free tier (those → N/A).
 */
export class BrapiStockAnalyzer implements StockAnalyzer {
  readonly name = "brapi";
  private readonly scorer = new FieldScorer();

  constructor(private readonly token: string) {}

  async analyze(stock: Stock): Promise<StockAnalysis> {
    if (!this.token) throw new Error("missing brapi token (BRAPI_TOKEN or providers.brapi.token)");

    const r =
      (await this.fetchResult(stock.ticker, RICH_MODULES)) ??
      (await this.fetchResult(stock.ticker, FREE_MODULES)) ??
      (await this.fetchResult(stock.ticker, ""));
    if (!r) throw new Error(`no brapi data for ${stock.ticker} (check token / plan)`);

    const ks = r.defaultKeyStatistics ?? {};
    const fd = r.financialData ?? {};
    const sd = r.summaryDetail ?? {};
    const sp = r.summaryProfile ?? {};
    const s = this.scorer;
    const n = toNumber;
    const fields = emptyFields();

    setScored(fields, s, "pl", n(r.priceEarnings ?? sd.trailingPE), ratioDisplay(n(r.priceEarnings ?? sd.trailingPE)));
    setScored(fields, s, "pvp", n(ks.priceToBook), ratioDisplay(n(ks.priceToBook)));
    setScored(fields, s, "peg", n(ks.pegRatio), ratioDisplay(n(ks.pegRatio)));
    setDisplay(fields, "dy", n(sd.dividendYield) * 100, pctDisplay(n(sd.dividendYield)));
    setScored(fields, s, "roe", n(fd.returnOnEquity) * 100, pctDisplay(n(fd.returnOnEquity)));
    setScored(fields, s, "netMargin", n(fd.profitMargins) * 100, pctDisplay(n(fd.profitMargins)));
    setScored(fields, s, "currentRatio", n(fd.currentRatio), ratioDisplay(n(fd.currentRatio)));
    setDisplay(fields, "netDebtEquity", n(fd.debtToEquity) / 100, ratioDisplay(n(fd.debtToEquity) / 100));
    setScored(fields, s, "revenueCagr5y", n(fd.revenueGrowth) * 100, pctDisplay(n(fd.revenueGrowth)));
    setScored(fields, s, "earningsCagr5y", n(fd.earningsGrowth) * 100, pctDisplay(n(fd.earningsGrowth)));

    const dy = fields.dy.numeric;
    return {
      kind: "analysis",
      ticker: stock.ticker,
      company: r.longName ?? r.shortName ?? stock.ticker,
      market: stock.market,
      currency: "BRL",
      sector: sp.sector ?? "—",
      profiles: dy !== undefined && dy >= 3 ? (["dividend"] as StockProfile[]) : [],
      fields,
      verdict: `From brapi.dev. ${this.coverage(fields)} (free plan exposes P/E only — PRO adds the rest).`,
      overall: overallFrom(fields),
    };
  }

  private async fetchResult(ticker: string, modules: string): Promise<any | null> {
    const q = modules ? `&fundamental=true&modules=${modules}` : "";
    const url = `${BASE}/${encodeURIComponent(ticker)}?token=${this.token}${q}`;
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body || body.error) return null;
      return body.results?.[0] ?? null;
    } catch {
      return null;
    }
  }

  private coverage(fields: Record<string, { numeric?: number }>): string {
    const known = Object.values(fields).filter((f) => f.numeric !== undefined).length;
    return `${known}/30 indicators`;
  }
}
