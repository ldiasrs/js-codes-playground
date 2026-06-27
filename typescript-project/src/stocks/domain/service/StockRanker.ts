import { FIELD_DEFINITIONS, FieldGroup, FieldKey } from "../model/FieldDefinition";
import { RankedStock } from "../model/RankedStock";
import { StockAnalysis } from "../model/StockAnalysis";
import { FieldScorer } from "./FieldScorer";

/** Pillar weights for the Fundamental Strength Score (sum need not be 100). */
export interface PillarWeights {
  profitability: number;
  debt: number;
  valuation: number;
  growth: number;
  efficiency: number;
}

export type Pillar = keyof PillarWeights;

export const DEFAULT_PILLAR_WEIGHTS: PillarWeights = {
  profitability: 30,
  debt: 20,
  valuation: 20,
  growth: 15,
  efficiency: 15,
};

export const PILLAR_ORDER: readonly Pillar[] = [
  "profitability",
  "debt",
  "valuation",
  "growth",
  "efficiency",
];

export interface PillarScore {
  readonly pillar: Pillar;
  readonly weight: number;
  /** 0–1 average of available scored fields, or null when none are present. */
  readonly score: number | null;
}

/**
 * Fundamental Strength Score (FSS): each scored field → 0–1 (FieldScorer), averaged
 * per pillar, then weighted by the configured pillar weights. Pillars with no data are
 * skipped and the remaining weights renormalized. Ranks weakest-first. Pure.
 */
export class StockRanker {
  private readonly scorer = new FieldScorer();
  /** Scored field keys grouped by pillar (a pillar == a field group). */
  readonly fieldsByPillar: Record<Pillar, FieldKey[]>;

  constructor(readonly weights: PillarWeights = DEFAULT_PILLAR_WEIGHTS) {
    const byGroup = {} as Record<FieldGroup, FieldKey[]>;
    for (const d of FIELD_DEFINITIONS) {
      if (!d.scored) continue;
      (byGroup[d.group] ||= []).push(d.key);
    }
    this.fieldsByPillar = {
      profitability: byGroup.profitability ?? [],
      debt: byGroup.debt ?? [],
      valuation: byGroup.valuation ?? [],
      growth: byGroup.growth ?? [],
      efficiency: byGroup.efficiency ?? [],
    };
  }

  /** Ranks weakest-first (worst score at position 1). */
  rank(analyses: StockAnalysis[]): RankedStock[] {
    return analyses
      .map((analysis) => ({ analysis, score: this.score(analysis) }))
      .sort((a, b) => a.score - b.score || a.analysis.ticker.localeCompare(b.analysis.ticker))
      .map((entry, index) => ({ ...entry, position: index + 1 }));
  }

  /** 0–100 FSS (higher = stronger). */
  score(analysis: StockAnalysis): number {
    let weighted = 0;
    let totalWeight = 0;
    for (const pillar of PILLAR_ORDER) {
      const ps = this.pillarScore(analysis, pillar);
      if (ps === null) continue;
      weighted += this.weights[pillar] * ps;
      totalWeight += this.weights[pillar];
    }
    return totalWeight === 0 ? 0 : Math.round((weighted / totalWeight) * 100);
  }

  /** Per-pillar 0–1 scores (null where no data) — for the report's breakdown/formula. */
  breakdown(analysis: StockAnalysis): PillarScore[] {
    return PILLAR_ORDER.map((pillar) => ({
      pillar,
      weight: this.weights[pillar],
      score: this.pillarScore(analysis, pillar),
    }));
  }

  private pillarScore(analysis: StockAnalysis, pillar: Pillar): number | null {
    let sum = 0;
    let n = 0;
    for (const key of this.fieldsByPillar[pillar]) {
      const field = analysis.fields[key];
      if (!field) continue;
      // Prefer the graded score from the raw number (data sources); fall back to the
      // field's status (LLM sources expose status but no number).
      let s = field.numeric !== undefined ? this.scorer.score(key, field.numeric) : NaN;
      if (!Number.isFinite(s)) {
        if (!field.status || field.status === "na") continue;
        s = field.status === "good" ? 1 : field.status === "caution" ? 0.5 : 0;
      }
      sum += s;
      n += 1;
    }
    return n === 0 ? null : sum / n;
  }
}
