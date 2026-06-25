import { FieldKey } from "../model/FieldDefinition";
import { FieldStatus } from "../model/FieldStatus";
import { RankedStock } from "../model/RankedStock";
import { StockAnalysis } from "../model/StockAnalysis";

/**
 * Scores each stock on how well its fundamentals match a *solid* stock and ranks
 * them weakest-first. Fields that define durability — a wide moat, low leverage,
 * real cash generation, high returns — carry the most weight.
 */
export class StockRanker {
  /** Relative importance of each field for a solid stock. */
  private static readonly WEIGHTS: Record<FieldKey, number> = {
    moat: 3,
    debtEquity: 3,
    freeCashFlow: 3,
    roe: 2,
    netMargin: 2,
    currentRatio: 2,
    pe: 1,
    peg: 1,
    pb: 1,
    dividendYield: 1,
    payoutRatio: 1,
    revenueGrowth: 1,
    epsGrowth: 1,
  };

  /** Points awarded per status (na/unknown earns nothing). */
  private static readonly STATUS_POINTS: Record<FieldStatus, number> = {
    good: 2,
    caution: 1,
    weak: 0,
    na: 0,
  };

  /** Ranks the given analyses weakest-first (worst score at position 1). */
  rank(analyses: StockAnalysis[]): RankedStock[] {
    return analyses
      .map((analysis) => ({ analysis, score: this.score(analysis) }))
      .sort((a, b) => a.score - b.score || a.analysis.ticker.localeCompare(b.analysis.ticker))
      .map((entry, index) => ({ ...entry, position: index + 1 }));
  }

  /** A 0–100 fundamentals score (higher = stronger). */
  score(analysis: StockAnalysis): number {
    let earned = 0;
    let max = 0;
    for (const key of Object.keys(StockRanker.WEIGHTS) as FieldKey[]) {
      const weight = StockRanker.WEIGHTS[key];
      const status = analysis.fields[key]?.status ?? "na";
      earned += weight * StockRanker.STATUS_POINTS[status];
      max += weight * StockRanker.STATUS_POINTS.good;
    }
    return max === 0 ? 0 : Math.round((earned / max) * 100);
  }
}
