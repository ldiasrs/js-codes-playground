import { StockAnalyzer } from "../../application/port/StockAnalyzer";
import { FieldKey } from "../../domain/model/FieldDefinition";
import { marketCurrency } from "../../domain/model/Market";
import { Stock } from "../../domain/model/Stock";
import { StockAnalysis } from "../../domain/model/StockAnalysis";
import { StockProfile } from "../../domain/model/StockProfile";
import { FieldScorer } from "../../domain/service/FieldScorer";
import { BROWSER_HEADERS, emptyFields, overallFrom, setDisplay, setScored } from "./financeApiSupport";

const BASE = "https://statusinvest.com.br";

/** Status Invest label → field key (+ whether it feeds the score). */
const LABEL_MAP: Array<{ label: string; key: FieldKey; scored: boolean }> = [
  // Valuation
  { label: "D.Y", key: "dy", scored: false },
  { label: "P/L", key: "pl", scored: true },
  { label: "PEG Ratio", key: "peg", scored: true },
  { label: "P/VP", key: "pvp", scored: true },
  { label: "EV/EBITDA", key: "evEbitda", scored: true },
  { label: "EV/EBIT", key: "evEbit", scored: false },
  { label: "P/EBITDA", key: "pEbitda", scored: false },
  { label: "P/EBIT", key: "pEbit", scored: false },
  { label: "VPA", key: "vpa", scored: false },
  { label: "P/Ativo", key: "pAtivo", scored: false },
  { label: "LPA", key: "lpa", scored: false },
  { label: "P/SR", key: "psr", scored: true },
  { label: "P/Cap. Giro", key: "pCapGiro", scored: false },
  { label: "P/Ativo Circ. Liq.", key: "pAtivCircLiq", scored: false },
  // Debt
  { label: "Dív. líquida/PL", key: "netDebtEquity", scored: false },
  { label: "Dív. líquida/EBITDA", key: "netDebtEbitda", scored: true },
  { label: "Dív. líquida/EBIT", key: "netDebtEbit", scored: false },
  { label: "PL/Ativos", key: "equityAssets", scored: false },
  { label: "Passivos/Ativos", key: "liabilitiesAssets", scored: true },
  { label: "Liq. corrente", key: "currentRatio", scored: true },
  // Efficiency
  { label: "M. Bruta", key: "grossMargin", scored: false },
  { label: "M. EBITDA", key: "ebitdaMargin", scored: false },
  { label: "M. EBIT", key: "ebitMargin", scored: true },
  { label: "M. Líquida", key: "netMargin", scored: true },
  // Profitability
  { label: "ROE", key: "roe", scored: true },
  { label: "ROA", key: "roa", scored: true },
  { label: "ROIC", key: "roic", scored: true },
  { label: "Giro ativos", key: "assetTurnover", scored: false },
  // Growth
  { label: "CAGR Receitas 5 anos", key: "revenueCagr5y", scored: true },
  { label: "CAGR Lucros 5 anos", key: "earningsCagr5y", scored: true },
];

/**
 * Brazil source: scrapes statusinvest.com.br — no key, full indicator set. The page
 * renders each indicator as `<h3 class="title">label</h3> … <strong class="value">value</strong>`.
 * Cloudflare-protected; realistic browser headers reduce challenges, and an optional
 * STATUSINVEST_COOKIE defeats a hard block. Values are pt-BR formatted.
 */
export class StatusInvestStockAnalyzer implements StockAnalyzer {
  readonly name = "statusinvest";
  private readonly scorer = new FieldScorer();

  constructor(private readonly cookie: string = "") {}

  async analyze(stock: Stock): Promise<StockAnalysis> {
    const html = await this.fetchPage(stock);
    const lookup = this.parsePairs(html);

    if (lookup.size === 0) {
      if (/challenge-platform|Just a moment|cf-chl/i.test(html)) {
        throw new Error("Status Invest blocked (Cloudflare) — set STATUSINVEST_COOKIE and retry");
      }
      throw new Error(`no Status Invest data for ${stock.ticker}`);
    }

    const fields = emptyFields();
    for (const { label, key, scored } of LABEL_MAP) {
      const raw = lookup.get(label);
      if (raw === undefined) continue;
      const numeric = this.parseBr(raw);
      if (scored) setScored(fields, this.scorer, key, numeric, raw);
      else setDisplay(fields, key, numeric, raw);
    }

    const dy = fields.dy.numeric;
    return {
      kind: "analysis",
      ticker: stock.ticker,
      company: this.parseCompany(html, stock.ticker),
      market: stock.market,
      currency: marketCurrency(stock.market),
      sector: "—",
      profiles: dy !== undefined && dy >= 3 ? (["dividend"] as StockProfile[]) : [],
      fields,
      verdict: `From statusinvest.com.br. ${this.coverage(fields)}.`,
      overall: overallFrom(fields),
    };
  }

  /** BR → /acoes/<ticker> ; US → /acoes/eua/<ticker>. */
  private pageUrl(stock: Stock): string {
    const slug = encodeURIComponent(stock.ticker.toLowerCase());
    return stock.market === "US" ? `${BASE}/acoes/eua/${slug}` : `${BASE}/acoes/${slug}`;
  }

  private async fetchPage(stock: Stock): Promise<string> {
    const url = this.pageUrl(stock);
    const headers: Record<string, string> = { ...BROWSER_HEADERS, Referer: url };
    if (this.cookie) headers["Cookie"] = this.cookie;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      if (res.status === 403) {
        throw new Error("Status Invest blocked (Cloudflare 403) — set STATUSINVEST_COOKIE and retry");
      }
      throw new Error(`Status Invest ${res.status} for ${stock.ticker}`);
    }
    return res.text();
  }

  /** Pairs each `title` h3 with the next `value` strong, taking the first real value per label. */
  private parsePairs(html: string): Map<string, string> {
    const re = /<(h3|strong)\b[^>]*class="[^"]*\b(title|value)\b[^"]*"[^>]*>(.*?)<\/\1>/gis;
    const tokens: Array<{ kind: "label" | "value"; text: string }> = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const kind = m[2].toLowerCase() === "title" ? "label" : "value";
      tokens.push({ kind, text: this.clean(m[3]) });
    }

    const lookup = new Map<string, string>();
    for (let i = 0; i < tokens.length - 1; i++) {
      if (tokens[i].kind !== "label") continue;
      const label = tokens[i].text;
      const value = tokens[i + 1].kind === "value" ? tokens[i + 1].text : "";
      const real = value && value !== "-";
      if (real && !lookup.has(label)) lookup.set(label, value);
    }
    return lookup;
  }

  private parseCompany(html: string, fallback: string): string {
    const title = html.match(/<title>(.*?)<\/title>/is)?.[1] ?? "";
    const head = this.clean(title.split("|")[0]); // drop " | Status Invest"
    // BR: "WEGE3 - WEG ON: …"  ·  US: "JPM: JP MORGAN CHASE & CO., …"
    const br = head.match(/-\s*(.+?)\s*:/);
    if (br) return br[1].trim();
    const us = head.match(/:\s*(.+?)\s*,/);
    if (us) return us[1].trim();
    return fallback;
  }

  /** pt-BR number → JS number ("35,43%" → 35.43, "4.092.480" → 4092480, "-0,19" → -0.19). */
  private parseBr(value: string | undefined): number {
    if (!value) return NaN;
    const cleaned = value.replace(/%/g, "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
    return parseFloat(cleaned);
  }

  private clean(text: string): string {
    return this.decodeEntities(text.replace(/<[^>]*>/g, ""))
      .replace(/\s+/g, " ")
      .trim();
  }

  private decodeEntities(s: string): string {
    return s
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&nbsp;/g, " ");
  }

  private coverage(fields: Record<string, { status: string; numeric?: number }>): string {
    const known = Object.values(fields).filter((f) => f.numeric !== undefined).length;
    return `${known}/30 indicators scraped`;
  }
}
