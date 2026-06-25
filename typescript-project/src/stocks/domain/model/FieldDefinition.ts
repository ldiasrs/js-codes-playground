/**
 * The 13 fundamental fields, in display order, with a plain-language meaning, a
 * concrete example, and the consultation index (good / caution / weak thresholds).
 * Single source of truth used both to parse LLM output and to render the report.
 */
export type FieldKey =
  | "pe"
  | "peg"
  | "pb"
  | "dividendYield"
  | "payoutRatio"
  | "roe"
  | "netMargin"
  | "debtEquity"
  | "currentRatio"
  | "freeCashFlow"
  | "revenueGrowth"
  | "epsGrowth"
  | "moat";

export interface FieldDefinition {
  readonly key: FieldKey;
  readonly label: string;
  /** Plain-language explanation anyone can follow. */
  readonly meaning: string;
  /** A concrete, worked example of the metric. */
  readonly example: string;
  readonly good: string;
  readonly caution: string;
  readonly weak: string;
}

export const FIELD_DEFINITIONS: readonly FieldDefinition[] = [
  {
    key: "pe",
    label: "P/E",
    meaning: "How many years of today's profit you pay for the share. Lower = cheaper.",
    example: "Share $20, earns $2/yr → P/E 10 (you pay 10× one year of profit).",
    good: "< 15",
    caution: "15–25",
    weak: "> 40 / negative",
  },
  {
    key: "peg",
    label: "PEG",
    meaning: "The P/E weighed against how fast profit is growing. Under 1 means growth is cheap.",
    example: "P/E 20 with profit growing 20%/yr → PEG 1.0 (fairly priced).",
    good: "< 1",
    caution: "1–2",
    weak: "> 2",
  },
  {
    key: "pb",
    label: "P/B",
    meaning: "Price versus the company's net worth on paper (assets minus debts).",
    example: "P/B 1 = paying exactly book value; P/B 3 = paying 3× what it's worth on paper.",
    good: "< 1.5",
    caution: "1.5–3",
    weak: "> 5",
  },
  {
    key: "dividendYield",
    label: "Dividend Yield",
    meaning: "The yearly dividend as a percentage of the share price — your cash return.",
    example: "$2 dividend on a $50 share → 4% yield.",
    good: "3–6%",
    caution: "1–3%",
    weak: "0% / > 8% (trap)",
  },
  {
    key: "payoutRatio",
    label: "Payout Ratio",
    meaning: "How much of the profit is handed out as dividends (the rest is reinvested).",
    example: "Earns $1, pays $0.50 → 50% payout (keeps half to grow).",
    good: "< 60%",
    caution: "60–80%",
    weak: "> 90%",
  },
  {
    key: "roe",
    label: "ROE",
    meaning: "Profit produced for each $1 of shareholders' money. Higher = more efficient.",
    example: "ROE 20% = $0.20 profit per year for every $1 of equity.",
    good: "> 15%",
    caution: "8–15%",
    weak: "< 8%",
  },
  {
    key: "netMargin",
    label: "Net Margin",
    meaning: "How much of every dollar of sales is left as profit after all costs.",
    example: "$100 in sales → $15 profit = 15% margin.",
    good: "> 15%",
    caution: "5–15%",
    weak: "< 5% / negative",
  },
  {
    key: "debtEquity",
    label: "Debt / Equity",
    meaning: "Debt compared to the owners' money — how leveraged (risky) the company is.",
    example: "D/E 0.5 = $0.50 of debt for every $1 of equity (low leverage).",
    good: "< 0.5",
    caution: "0.5–1.5",
    weak: "> 2",
  },
  {
    key: "currentRatio",
    label: "Current Ratio",
    meaning: "Cash and near-cash versus bills due within a year — can it pay short-term?",
    example: "Ratio 2 = $2 available for every $1 owed this year.",
    good: "1.5–3",
    caution: "1–1.5",
    weak: "< 1",
  },
  {
    key: "freeCashFlow",
    label: "Free Cash Flow",
    meaning: "Real cash left after running the business and investing in it.",
    example: "Operating cash $10M − $4M spent on equipment = $6M free cash.",
    good: "Positive & growing",
    caution: "Flat",
    weak: "Negative",
  },
  {
    key: "revenueGrowth",
    label: "Revenue Growth (YoY)",
    meaning: "How fast total sales grow versus the same period last year.",
    example: "Sales $100M → $112M = 12% growth.",
    good: "> 10%",
    caution: "3–10%",
    weak: "< 0%",
  },
  {
    key: "epsGrowth",
    label: "EPS Growth",
    meaning: "How fast profit per share grows — earnings rising for each owner.",
    example: "EPS $2.00 → $2.30 = 15% growth.",
    good: "> 10%",
    caution: "0–10%",
    weak: "negative",
  },
  {
    key: "moat",
    label: "Moat",
    meaning: "A durable edge that keeps rivals out and protects profits for years.",
    example: "Strong brand, patents, or network effects (e.g. a dominant chipmaker).",
    good: "Wide",
    caution: "Narrow",
    weak: "None",
  },
];

export const FIELD_KEYS: readonly FieldKey[] = FIELD_DEFINITIONS.map((f) => f.key);
