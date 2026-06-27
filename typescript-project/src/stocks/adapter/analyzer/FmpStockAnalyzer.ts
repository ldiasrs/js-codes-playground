import { StockAnalyzer } from "../../application/port/StockAnalyzer";
import { Stock } from "../../domain/model/Stock";
import { StockAnalysis } from "../../domain/model/StockAnalysis";
import { StockProfile } from "../../domain/model/StockProfile";
import { FieldScorer } from "../../domain/service/FieldScorer";
import { emptyFields, getJson, overallFrom, pctDisplay, ratioDisplay, setDisplay, setScored, toNumber } from "./financeApiSupport";

const BASE = "https://financialmodelingprep.com/stable";

/** Annualize a cumulative 5y growth fraction → annual %; NaN-safe. */
function annualize5y(fraction: number): number {
  if (!Number.isFinite(fraction) || 1 + fraction <= 0) return NaN;
  return (Math.pow(1 + fraction, 1 / 5) - 1) * 100;
}

/**
 * US source (Financial Modeling Prep, stable API). Maps TTM ratios + key metrics +
 * growth to the field set. BR-specific valuation fields (P/Cap.Giro, P/Ativo Circ. Liq.)
 * aren't provided → N/A.
 */
export class FmpStockAnalyzer implements StockAnalyzer {
  readonly name = "fmp";
  private readonly scorer = new FieldScorer();

  constructor(private readonly apiKey: string) {}

  async analyze(stock: Stock): Promise<StockAnalysis> {
    if (!this.apiKey) throw new Error("missing FMP api key (FMP_API_KEY or providers.fmp.api_key)");

    const [ratiosArr, metricsArr, growthArr, profileArr] = await Promise.all([
      this.get("ratios-ttm", stock.ticker),
      this.get("key-metrics-ttm", stock.ticker),
      this.get("financial-growth", stock.ticker),
      this.get("profile", stock.ticker),
    ]);
    const r = ratiosArr?.[0] ?? {};
    const k = metricsArr?.[0] ?? {};
    const g = growthArr?.[0] ?? {};
    const p = profileArr?.[0] ?? {};
    if (!ratiosArr?.length && !profileArr?.length) throw new Error(`no FMP data for ${stock.ticker}`);

    const s = this.scorer;
    const n = toNumber;
    const fields = emptyFields();

    // Valuation
    setScored(fields, s, "pl", n(r.priceToEarningsRatioTTM), ratioDisplay(n(r.priceToEarningsRatioTTM)));
    setScored(fields, s, "pvp", n(r.priceToBookRatioTTM), ratioDisplay(n(r.priceToBookRatioTTM)));
    setScored(fields, s, "peg", n(r.priceToEarningsGrowthRatioTTM), ratioDisplay(n(r.priceToEarningsGrowthRatioTTM)));
    setScored(fields, s, "psr", n(r.priceToSalesRatioTTM), ratioDisplay(n(r.priceToSalesRatioTTM)));
    setScored(fields, s, "evEbitda", n(k.evToEBITDATTM ?? r.enterpriseValueMultipleTTM), ratioDisplay(n(k.evToEBITDATTM ?? r.enterpriseValueMultipleTTM)));
    setDisplay(fields, "dy", n(r.dividendYieldTTM) * 100, pctDisplay(n(r.dividendYieldTTM)));
    setDisplay(fields, "vpa", n(r.bookValuePerShareTTM), ratioDisplay(n(r.bookValuePerShareTTM)));
    setDisplay(fields, "lpa", n(r.netIncomePerShareTTM), ratioDisplay(n(r.netIncomePerShareTTM)));

    // Debt / health
    setScored(fields, s, "netDebtEbitda", n(k.netDebtToEBITDATTM), ratioDisplay(n(k.netDebtToEBITDATTM)));
    setScored(fields, s, "currentRatio", n(r.currentRatioTTM), ratioDisplay(n(r.currentRatioTTM)));
    const leverage = n(r.financialLeverageRatioTTM); // assets / equity
    if (Number.isFinite(leverage) && leverage !== 0) {
      const equityAssets = 1 / leverage;
      setDisplay(fields, "equityAssets", equityAssets, ratioDisplay(equityAssets));
      setScored(fields, s, "liabilitiesAssets", 1 - equityAssets, ratioDisplay(1 - equityAssets));
    }
    setDisplay(fields, "netDebtEquity", n(r.debtToEquityRatioTTM), ratioDisplay(n(r.debtToEquityRatioTTM)));

    // Efficiency
    setDisplay(fields, "grossMargin", n(r.grossProfitMarginTTM) * 100, pctDisplay(n(r.grossProfitMarginTTM)));
    setDisplay(fields, "ebitdaMargin", n(r.ebitdaMarginTTM) * 100, pctDisplay(n(r.ebitdaMarginTTM)));
    setScored(fields, s, "ebitMargin", n(r.ebitMarginTTM) * 100, pctDisplay(n(r.ebitMarginTTM)));
    setScored(fields, s, "netMargin", n(r.netProfitMarginTTM) * 100, pctDisplay(n(r.netProfitMarginTTM)));

    // Profitability
    setScored(fields, s, "roe", n(k.returnOnEquityTTM) * 100, pctDisplay(n(k.returnOnEquityTTM)));
    setScored(fields, s, "roa", n(k.returnOnAssetsTTM) * 100, pctDisplay(n(k.returnOnAssetsTTM)));
    setScored(fields, s, "roic", n(k.returnOnInvestedCapitalTTM) * 100, pctDisplay(n(k.returnOnInvestedCapitalTTM)));
    setDisplay(fields, "assetTurnover", n(r.assetTurnoverTTM), ratioDisplay(n(r.assetTurnoverTTM)));

    // Growth — annualized 5y (fall back to TTM YoY)
    const revCagr = Number.isFinite(annualize5y(n(g.fiveYRevenueGrowthPerShare)))
      ? annualize5y(n(g.fiveYRevenueGrowthPerShare))
      : n(g.revenueGrowth) * 100;
    const epsCagr = Number.isFinite(annualize5y(n(g.fiveYNetIncomeGrowthPerShare)))
      ? annualize5y(n(g.fiveYNetIncomeGrowthPerShare))
      : n(g.epsgrowth) * 100;
    setScored(fields, s, "revenueCagr5y", revCagr, `${revCagr.toFixed(1)}%`);
    setScored(fields, s, "earningsCagr5y", epsCagr, `${epsCagr.toFixed(1)}%`);

    const dy = fields.dy.numeric;
    return {
      kind: "analysis",
      ticker: stock.ticker,
      company: p.companyName ?? stock.ticker,
      market: stock.market,
      currency: "USD",
      sector: p.sector ?? "—",
      profiles: dy !== undefined && dy >= 3 ? (["dividend"] as StockProfile[]) : [],
      fields,
      verdict: `From Financial Modeling Prep. ${this.coverage(fields)}.`,
      overall: overallFrom(fields),
    };
  }

  private get(endpoint: string, ticker: string): Promise<any> {
    return getJson(`${BASE}/${endpoint}?symbol=${encodeURIComponent(ticker)}&apikey=${this.apiKey}`, `fmp ${endpoint}`);
  }

  private coverage(fields: Record<string, { numeric?: number }>): string {
    const known = Object.values(fields).filter((f) => f.numeric !== undefined).length;
    return `${known}/30 indicators`;
  }
}
