import { FieldKey } from "../model/FieldDefinition";
import { FieldStatus } from "../model/FieldStatus";

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
/** Higher-is-better: 0 at `lo`, 1 at `hi`. */
const up = (v: number, lo: number, hi: number): number => clamp01((v - lo) / (hi - lo));
/** Lower-is-better: 1 at `good`, 0 at `bad`. */
const down = (v: number, good: number, bad: number): number => clamp01((bad - v) / (bad - good));

type Band = (v: number) => number;

/**
 * Graded metric scorer: maps a raw indicator value to a 0–1 strength score using
 * rule-of-thumb bands. Only the FSS-scored fields have bands. Pure.
 */
export class FieldScorer {
  private static readonly BANDS: Partial<Record<FieldKey, Band>> = {
    // valuation (lower price = better; P/L scored via earnings yield)
    // ≥3% → good (✅); >8% treated as a likely-unsustainable "trap".
    dy: (v) => (v <= 0 ? 0 : v > 8 ? 0.4 : clamp01(v / 4.5)),
    pl: (v) => (v > 0 ? up(100 / v, 2, 12) : 0),
    peg: (v) => (v > 0 ? down(v, 1, 3) : 0),
    pvp: (v) => (v > 0 ? down(v, 1, 6) : 0),
    evEbitda: (v) => (v > 0 ? down(v, 6, 18) : 0),
    evEbit: (v) => (v > 0 ? down(v, 6, 20) : 0),
    pEbitda: (v) => (v > 0 ? down(v, 4, 16) : 0),
    pEbit: (v) => (v > 0 ? down(v, 6, 20) : 0),
    pAtivo: (v) => (v > 0 ? down(v, 0.3, 5) : 0),
    psr: (v) => (v > 0 ? down(v, 0.5, 6) : 0),
    // debt / health
    netDebtEquity: (v) => (v <= 0 ? 1 : down(v, 0, 2)),
    netDebtEbitda: (v) => (v <= 0 ? 1 : down(v, 0, 3.5)),
    netDebtEbit: (v) => (v <= 0 ? 1 : down(v, 0, 4)),
    equityAssets: (v) => up(v, 0.2, 0.7),
    liabilitiesAssets: (v) => down(v, 0.3, 0.8),
    currentRatio: (v) => up(v, 0.8, 2.0),
    // efficiency
    grossMargin: (v) => up(v, 0, 50),
    ebitdaMargin: (v) => up(v, 0, 30),
    ebitMargin: (v) => up(v, 0, 25),
    netMargin: (v) => up(v, 0, 20),
    // profitability
    roe: (v) => up(v, 0, 20),
    roa: (v) => up(v, 0, 15),
    roic: (v) => up(v, 0, 15),
    assetTurnover: (v) => up(v, 0.2, 1.5),
    // growth
    revenueCagr5y: (v) => up(v, 0, 15),
    earningsCagr5y: (v) => up(v, 0, 15),
  };

  /** 0–1 graded score; NaN if the field isn't scored or the value is missing. */
  score(key: FieldKey, value: number): number {
    const band = FieldScorer.BANDS[key];
    if (!band || !Number.isFinite(value)) return NaN;
    return band(value);
  }

  isScored(key: FieldKey): boolean {
    return !!FieldScorer.BANDS[key];
  }

  /** Bucket a 0–1 score into a status badge for display. */
  statusFromScore(score: number): FieldStatus {
    if (!Number.isFinite(score)) return "na";
    if (score >= 0.66) return "good";
    if (score >= 0.33) return "caution";
    return "weak";
  }
}
