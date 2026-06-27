/**
 * The Status Invest indicator set, grouped by category, with English + pt-BR labels.
 * `scored` fields feed the Fundamental Strength Score (see StockRanker); the rest are
 * display-only. Single source of truth for parsing, scoring, and the report.
 */
export type FieldGroup = "valuation" | "debt" | "efficiency" | "profitability" | "growth";

export type FieldKey =
  // valuation
  | "dy"
  | "pl"
  | "peg"
  | "pvp"
  | "evEbitda"
  | "evEbit"
  | "pEbitda"
  | "pEbit"
  | "vpa"
  | "pAtivo"
  | "lpa"
  | "psr"
  | "pCapGiro"
  | "pAtivCircLiq"
  // debt
  | "netDebtEquity"
  | "netDebtEbitda"
  | "netDebtEbit"
  | "equityAssets"
  | "liabilitiesAssets"
  | "currentRatio"
  // efficiency
  | "grossMargin"
  | "ebitdaMargin"
  | "ebitMargin"
  | "netMargin"
  // profitability
  | "roe"
  | "roa"
  | "roic"
  | "assetTurnover"
  // growth
  | "revenueCagr5y"
  | "earningsCagr5y";

export interface FieldDefinition {
  readonly key: FieldKey;
  readonly group: FieldGroup;
  readonly labelEn: string;
  readonly labelPt: string;
  /** Feeds the FSS score (has a band in FieldScorer). */
  readonly scored: boolean;
  readonly meaning: string;
  readonly example: string;
}

const F = (
  key: FieldKey,
  group: FieldGroup,
  labelEn: string,
  labelPt: string,
  scored: boolean,
  meaning: string,
  example: string,
): FieldDefinition => ({ key, group, labelEn, labelPt, scored, meaning, example });

export const FIELD_DEFINITIONS: readonly FieldDefinition[] = [
  // ---- Valuation ----
  F("dy", "valuation", "Dividend Yield", "D.Y", false, "Yearly dividend ÷ price.", "$2 on a $50 share → 4%."),
  F("pl", "valuation", "P/E", "P/L", true, "Years of profit you pay for the share (lower = cheaper).", "Price 20 ÷ EPS 2 → 10."),
  F("peg", "valuation", "PEG Ratio", "PEG Ratio", true, "P/E vs. profit growth (under 1 = growth is cheap).", "P/E 20, growth 20% → 1.0."),
  F("pvp", "valuation", "P/B", "P/VP", true, "Price vs. book value.", "P/VP 3 = 3× book value."),
  F("evEbitda", "valuation", "EV/EBITDA", "EV/EBITDA", true, "Enterprise value vs. operating cash earnings.", "Lower is cheaper; <8 attractive."),
  F("evEbit", "valuation", "EV/EBIT", "EV/EBIT", false, "Enterprise value vs. operating profit.", "Used to derive earnings yield."),
  F("pEbitda", "valuation", "P/EBITDA", "P/EBITDA", false, "Price vs. EBITDA.", "—"),
  F("pEbit", "valuation", "P/EBIT", "P/EBIT", false, "Price vs. EBIT.", "—"),
  F("vpa", "valuation", "Book Value / Share", "VPA", false, "Equity per share.", "Equity ÷ shares."),
  F("pAtivo", "valuation", "Price / Assets", "P/Ativo", false, "Price vs. total assets.", "—"),
  F("lpa", "valuation", "EPS", "LPA", false, "Earnings per share.", "Profit ÷ shares."),
  F("psr", "valuation", "Price / Sales", "P/SR", true, "Price vs. revenue.", "P/SR 1 = 1× annual sales."),
  F("pCapGiro", "valuation", "Price / Working Capital", "P/Cap. Giro", false, "Price vs. working capital.", "—"),
  F("pAtivCircLiq", "valuation", "Price / Net Current Assets", "P/Ativo Circ. Liq.", false, "Price vs. net current assets.", "—"),
  // ---- Debt / Health ----
  F("netDebtEquity", "debt", "Net Debt / Equity", "Dív. líquida/PL", false, "Net debt vs. equity (negative = net cash).", "−0.2 = net cash."),
  F("netDebtEbitda", "debt", "Net Debt / EBITDA", "Dív. líquida/EBITDA", true, "Years of EBITDA to repay net debt.", "<1 strong; <0 net cash."),
  F("netDebtEbit", "debt", "Net Debt / EBIT", "Dív. líquida/EBIT", false, "Net debt vs. operating profit.", "—"),
  F("equityAssets", "debt", "Equity / Assets", "PL/Ativos", false, "Share of assets funded by equity.", "0.5 = half equity-funded."),
  F("liabilitiesAssets", "debt", "Liabilities / Assets", "Passivos/Ativos", true, "Share of assets funded by debt.", "0.3 low; 0.85 high."),
  F("currentRatio", "debt", "Current Ratio", "Liq. corrente", true, "Short-term assets vs. short-term bills.", "2 = $2 per $1 due."),
  // ---- Efficiency ----
  F("grossMargin", "efficiency", "Gross Margin", "M. Bruta", false, "Revenue left after cost of goods.", "33% gross margin."),
  F("ebitdaMargin", "efficiency", "EBITDA Margin", "M. EBITDA", false, "EBITDA ÷ revenue.", "22% EBITDA margin."),
  F("ebitMargin", "efficiency", "EBIT Margin", "M. EBIT", true, "Operating profit ÷ revenue.", "20% operating margin."),
  F("netMargin", "efficiency", "Net Margin", "M. Líquida", true, "Profit kept per dollar of sales.", "$100 sales → $15 profit = 15%."),
  // ---- Profitability ----
  F("roe", "profitability", "ROE", "ROE", true, "Profit per $1 of equity.", "ROE 20% = $0.20 per $1 equity."),
  F("roa", "profitability", "ROA", "ROA", true, "Profit per $1 of assets.", "ROA 10% = efficient asset use."),
  F("roic", "profitability", "ROIC", "ROIC", true, "Return on invested capital.", "ROIC 15%+ = value-creating."),
  F("assetTurnover", "profitability", "Asset Turnover", "Giro ativos", false, "Revenue per $1 of assets.", "0.9 = $0.90 sales per $1 assets."),
  // ---- Growth ----
  F("revenueCagr5y", "growth", "Revenue CAGR 5y", "CAGR Receitas 5 anos", true, "5-year revenue growth rate.", "18% per year."),
  F("earningsCagr5y", "growth", "Earnings CAGR 5y", "CAGR Lucros 5 anos", true, "5-year profit growth rate.", "21% per year."),
];

export const FIELD_KEYS: readonly FieldKey[] = FIELD_DEFINITIONS.map((f) => f.key);

export const FIELD_GROUPS: readonly { group: FieldGroup; labelEn: string; labelPt: string }[] = [
  { group: "profitability", labelEn: "Profitability", labelPt: "Rentabilidade" },
  { group: "efficiency", labelEn: "Efficiency", labelPt: "Eficiência" },
  { group: "debt", labelEn: "Debt / Health", labelPt: "Endividamento" },
  { group: "growth", labelEn: "Growth", labelPt: "Crescimento" },
  { group: "valuation", labelEn: "Valuation", labelPt: "Valuation" },
];
