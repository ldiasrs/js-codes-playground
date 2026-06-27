import { StockAnalyzer } from "../../application/port/StockAnalyzer";
import { FieldKey } from "../../domain/model/FieldDefinition";
import { Stock } from "../../domain/model/Stock";
import { StockAnalysis } from "../../domain/model/StockAnalysis";
import { StockProfile } from "../../domain/model/StockProfile";
import { FieldScorer } from "../../domain/service/FieldScorer";
import { BROWSER_HEADERS, emptyFields, overallFrom, ratioDisplay, setDisplay, setScored } from "./financeApiSupport";

const URL = "https://www.fundamentus.com.br/detalhes.php?papel=";

/** Fundamentus label → field key (+ scored flag). */
const LABEL_MAP: Array<{ label: string; key: FieldKey; scored: boolean }> = [
  { label: "P/L", key: "pl", scored: true },
  { label: "LPA", key: "lpa", scored: false },
  { label: "P/VP", key: "pvp", scored: true },
  { label: "VPA", key: "vpa", scored: false },
  { label: "P/EBIT", key: "pEbit", scored: false },
  { label: "Marg. Bruta", key: "grossMargin", scored: false },
  { label: "PSR", key: "psr", scored: true },
  { label: "Marg. EBIT", key: "ebitMargin", scored: true },
  { label: "P/Ativos", key: "pAtivo", scored: false },
  { label: "Marg. Líquida", key: "netMargin", scored: true },
  { label: "P/Cap. Giro", key: "pCapGiro", scored: false },
  { label: "P/Ativ Circ Liq", key: "pAtivCircLiq", scored: false },
  { label: "ROIC", key: "roic", scored: true },
  { label: "Div. Yield", key: "dy", scored: false },
  { label: "ROE", key: "roe", scored: true },
  { label: "EV/EBITDA", key: "evEbitda", scored: true },
  { label: "Liquidez Corr", key: "currentRatio", scored: true },
  { label: "EV/EBIT", key: "evEbit", scored: false },
  { label: "Dív Líq / Patrim", key: "netDebtEquity", scored: false },
  { label: "Cres. Rec (5a)", key: "revenueCagr5y", scored: true },
  { label: "Giro Ativos", key: "assetTurnover", scored: false },
];

/**
 * Brazil source (alternate): scrapes fundamentus.com.br. Maps its indicators to the
 * field set and computes a few derived ones from the balance sheet. Net Debt/EBITDA,
 * PEG, EBITDA margin and Earnings CAGR aren't on the page → N/A.
 */
export class FundamentusStockAnalyzer implements StockAnalyzer {
  readonly name = "fundamentus";
  private readonly scorer = new FieldScorer();

  async analyze(stock: Stock): Promise<StockAnalysis> {
    const lookup = await this.fetchIndicators(stock.ticker);
    if (!lookup.has("P/L")) throw new Error(`no Fundamentus data for ${stock.ticker}`);

    const fields = emptyFields();
    for (const { label, key, scored } of LABEL_MAP) {
      const raw = lookup.get(label);
      if (raw === undefined) continue;
      const numeric = this.parseBr(raw);
      if (scored) setScored(fields, this.scorer, key, numeric, raw);
      else setDisplay(fields, key, numeric, raw);
    }

    // Derived from the balance sheet / income statement (12m).
    const assets = this.parseBr(lookup.get("Ativo"));
    const equity = this.parseBr(lookup.get("Patrim. Líq"));
    const netProfit = this.parseBr(lookup.get("Lucro Líquido"));
    const netDebt = this.parseBr(lookup.get("Dív. Líquida"));
    const ebit = this.parseBr(lookup.get("EBIT"));
    if (Number.isFinite(assets) && assets !== 0) {
      if (Number.isFinite(equity)) {
        setDisplay(fields, "equityAssets", equity / assets, ratioDisplay(equity / assets));
        const liabRatio = (assets - equity) / assets;
        setScored(fields, this.scorer, "liabilitiesAssets", liabRatio, ratioDisplay(liabRatio));
      }
      if (Number.isFinite(netProfit)) {
        const roa = (netProfit / assets) * 100;
        setScored(fields, this.scorer, "roa", roa, `${roa.toFixed(1)}%`);
      }
    }
    if (Number.isFinite(netDebt) && Number.isFinite(ebit) && ebit !== 0) {
      setDisplay(fields, "netDebtEbit", netDebt / ebit, ratioDisplay(netDebt / ebit));
    }

    const dy = fields.dy.numeric;
    return {
      kind: "analysis",
      ticker: stock.ticker,
      company: lookup.get("Empresa") ?? stock.ticker,
      market: stock.market,
      currency: "BRL",
      sector: lookup.get("Setor") ?? "—",
      profiles: dy !== undefined && dy >= 3 ? (["dividend"] as StockProfile[]) : [],
      fields,
      verdict: `From fundamentus.com.br. ${this.coverage(fields)} (revenue growth = 5y CAGR).`,
      overall: overallFrom(fields),
    };
  }

  private async fetchIndicators(ticker: string): Promise<Map<string, string>> {
    const res = await fetch(`${URL}${encodeURIComponent(ticker)}`, { headers: BROWSER_HEADERS });
    if (!res.ok) throw new Error(`Fundamentus ${res.status} for ${ticker}`);
    const html = Buffer.from(await res.arrayBuffer()).toString("latin1");

    const spans: string[] = [];
    const re = /<span class="txt">(.*?)<\/span>/gs;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      spans.push(m[1].replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim());
    }

    const lookup = new Map<string, string>();
    for (let i = 0; i < spans.length - 1; i++) {
      if (spans[i] && !lookup.has(spans[i])) lookup.set(spans[i], spans[i + 1]);
    }
    return lookup;
  }

  private parseBr(value: string | undefined): number {
    if (!value) return NaN;
    const cleaned = value.replace(/%/g, "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
    return parseFloat(cleaned);
  }

  private coverage(fields: Record<string, { numeric?: number }>): string {
    const known = Object.values(fields).filter((f) => f.numeric !== undefined).length;
    return `${known}/30 indicators`;
  }
}
