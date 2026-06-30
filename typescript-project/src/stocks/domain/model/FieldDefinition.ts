/**
 * The Status Invest indicator set, grouped by category, with English + pt-BR labels,
 * meanings and examples. `scored` fields feed the Fundamental Strength Score (see
 * StockRanker); the rest are display-only. Single source of truth for parsing, scoring,
 * and the report/sheet.
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
  readonly meaningPt: string;
  readonly example: string;
  readonly examplePt: string;
}

const F = (
  key: FieldKey,
  group: FieldGroup,
  labelEn: string,
  labelPt: string,
  scored: boolean,
  meaning: string,
  meaningPt: string,
  example: string,
  examplePt: string,
): FieldDefinition => ({ key, group, labelEn, labelPt, scored, meaning, meaningPt, example, examplePt });

export const FIELD_DEFINITIONS: readonly FieldDefinition[] = [
  // ---- Valuation ----
  F("dy", "valuation", "Dividend Yield", "D.Y", true,
    "Yearly dividend ÷ price.", "Dividendo anual ÷ preço.",
    "$2 on a $50 share → 4%.", "R$2 numa ação de R$50 → 4%."),
  F("pl", "valuation", "P/E", "P/L", true,
    "Years of profit you pay for the share (lower = cheaper).", "Anos de lucro que você paga pela ação (menor = mais barata).",
    "Price 20 ÷ EPS 2 → 10.", "Preço 20 ÷ LPA 2 → 10."),
  F("peg", "valuation", "PEG Ratio", "PEG Ratio", true,
    "P/E vs. profit growth (under 1 = growth is cheap).", "P/L em relação ao crescimento do lucro (abaixo de 1 = crescimento barato).",
    "P/E 20, growth 20% → 1.0.", "P/L 20, crescimento 20% → 1,0."),
  F("pvp", "valuation", "P/B", "P/VP", true,
    "Price vs. book value.", "Preço em relação ao valor patrimonial.",
    "P/B 3 = 3× book value.", "P/VP 3 = 3× o valor patrimonial."),
  F("evEbitda", "valuation", "EV/EBITDA", "EV/EBITDA", true,
    "Enterprise value vs. operating cash earnings.", "Valor da firma em relação ao caixa operacional (EBITDA).",
    "Lower is cheaper; <8 attractive.", "Menor é mais barato; <8 atraente."),
  F("evEbit", "valuation", "EV/EBIT", "EV/EBIT", false,
    "Enterprise value vs. operating profit.", "Valor da firma em relação ao lucro operacional.",
    "Used to derive earnings yield.", "Usado para derivar o earnings yield."),
  F("pEbitda", "valuation", "P/EBITDA", "P/EBITDA", false,
    "Price vs. EBITDA.", "Preço em relação ao EBITDA.", "—", "—"),
  F("pEbit", "valuation", "P/EBIT", "P/EBIT", false,
    "Price vs. EBIT.", "Preço em relação ao EBIT.", "—", "—"),
  F("vpa", "valuation", "Book Value / Share", "VPA", false,
    "Equity per share.", "Patrimônio por ação.", "Equity ÷ shares.", "Patrimônio ÷ nº de ações."),
  F("pAtivo", "valuation", "Price / Assets", "P/Ativo", false,
    "Price vs. total assets.", "Preço em relação aos ativos totais.", "—", "—"),
  F("lpa", "valuation", "EPS", "LPA", false,
    "Earnings per share.", "Lucro por ação.", "Profit ÷ shares.", "Lucro ÷ nº de ações."),
  F("psr", "valuation", "Price / Sales", "P/SR", true,
    "Price vs. revenue.", "Preço em relação à receita.", "P/SR 1 = 1× annual sales.", "P/SR 1 = 1× a receita anual."),
  F("pCapGiro", "valuation", "Price / Working Capital", "P/Cap. Giro", false,
    "Price vs. working capital.", "Preço em relação ao capital de giro.", "—", "—"),
  F("pAtivCircLiq", "valuation", "Price / Net Current Assets", "P/Ativo Circ. Liq.", false,
    "Price vs. net current assets.", "Preço em relação ao ativo circulante líquido.", "—", "—"),
  // ---- Debt / Health ----
  F("netDebtEquity", "debt", "Net Debt / Equity", "Dív. líquida/PL", false,
    "Net debt vs. equity (negative = net cash).", "Dívida líquida em relação ao patrimônio (negativo = caixa líquido).",
    "−0.2 = net cash.", "−0,2 = caixa líquido."),
  F("netDebtEbitda", "debt", "Net Debt / EBITDA", "Dív. líquida/EBITDA", true,
    "Years of EBITDA to repay net debt.", "Anos de EBITDA para quitar a dívida líquida.",
    "<1 strong; <0 net cash.", "<1 forte; <0 caixa líquido."),
  F("netDebtEbit", "debt", "Net Debt / EBIT", "Dív. líquida/EBIT", false,
    "Net debt vs. operating profit.", "Dívida líquida em relação ao lucro operacional.", "—", "—"),
  F("equityAssets", "debt", "Equity / Assets", "PL/Ativos", false,
    "Share of assets funded by equity.", "Parte dos ativos financiada por patrimônio.",
    "0.5 = half equity-funded.", "0,5 = metade financiada por patrimônio."),
  F("liabilitiesAssets", "debt", "Liabilities / Assets", "Passivos/Ativos", true,
    "Share of assets funded by debt.", "Parte dos ativos financiada por passivos.",
    "0.3 low; 0.85 high.", "0,3 baixo; 0,85 alto."),
  F("currentRatio", "debt", "Current Ratio", "Liq. corrente", true,
    "Short-term assets vs. short-term bills.", "Ativos de curto prazo vs. contas de curto prazo.",
    "2 = $2 per $1 due.", "2 = R$2 para cada R$1 a vencer."),
  // ---- Efficiency ----
  F("grossMargin", "efficiency", "Gross Margin", "M. Bruta", false,
    "Revenue left after cost of goods.", "Receita restante após o custo dos produtos.",
    "33% gross margin.", "Margem bruta de 33%."),
  F("ebitdaMargin", "efficiency", "EBITDA Margin", "M. EBITDA", false,
    "EBITDA ÷ revenue.", "EBITDA ÷ receita.", "22% EBITDA margin.", "Margem EBITDA de 22%."),
  F("ebitMargin", "efficiency", "EBIT / Operating Margin", "M. EBIT", true,
    "Operating profit ÷ revenue.", "Lucro operacional ÷ receita.", "20% operating margin.", "Margem operacional de 20%."),
  F("netMargin", "efficiency", "Net Margin", "M. Líquida", true,
    "Profit kept per dollar of sales.", "Lucro retido por real de venda.",
    "$100 sales → $15 profit = 15%.", "R$100 de venda → R$15 de lucro = 15%."),
  // ---- Profitability ----
  F("roe", "profitability", "ROE", "ROE", true,
    "Profit per $1 of equity.", "Lucro por R$1 de patrimônio.",
    "ROE 20% = $0.20 per $1 equity.", "ROE 20% = R$0,20 por R$1 de patrimônio."),
  F("roa", "profitability", "ROA", "ROA", true,
    "Profit per $1 of assets.", "Lucro por R$1 de ativos.",
    "ROA 10% = efficient asset use.", "ROA 10% = uso eficiente dos ativos."),
  F("roic", "profitability", "ROIC", "ROIC", true,
    "Return on invested capital.", "Retorno sobre o capital investido.",
    "ROIC 15%+ = value-creating.", "ROIC 15%+ = cria valor."),
  F("assetTurnover", "profitability", "Asset Turnover", "Giro ativos", false,
    "Revenue per $1 of assets.", "Receita por R$1 de ativos.",
    "0.9 = $0.90 sales per $1 assets.", "0,9 = R$0,90 de venda por R$1 de ativos."),
  // ---- Growth ----
  F("revenueCagr5y", "growth", "Revenue CAGR 5y", "CAGR Receitas 5 anos", true,
    "5-year revenue growth rate.", "Crescimento da receita em 5 anos (CAGR).", "18% per year.", "18% ao ano."),
  F("earningsCagr5y", "growth", "Earnings CAGR 5y", "CAGR Lucros 5 anos", true,
    "5-year profit growth rate.", "Crescimento do lucro em 5 anos (CAGR).", "21% per year.", "21% ao ano."),
];

export const FIELD_KEYS: readonly FieldKey[] = FIELD_DEFINITIONS.map((f) => f.key);

export const FIELD_GROUPS: readonly { group: FieldGroup; labelEn: string; labelPt: string }[] = [
  { group: "profitability", labelEn: "Profitability", labelPt: "Rentabilidade" },
  { group: "efficiency", labelEn: "Efficiency", labelPt: "Eficiência" },
  { group: "debt", labelEn: "Debt / Health", labelPt: "Endividamento" },
  { group: "growth", labelEn: "Growth", labelPt: "Crescimento" },
  { group: "valuation", labelEn: "Valuation", labelPt: "Valuation" },
];
