import {
  FIELD_DEFINITIONS,
  FIELD_GROUPS,
  FieldGroup,
  FieldKey,
} from "../../domain/model/FieldDefinition";
import { FieldStatus } from "../../domain/model/FieldStatus";
import { marketLabel } from "../../domain/model/Market";
import {
  AnalysisResult,
  FailedAnalysis,
  StockAnalysis,
  StockField,
  isFailed,
} from "../../domain/model/StockAnalysis";
import { StockProfile, profileLabel } from "../../domain/model/StockProfile";
import { RankedStock } from "../../domain/model/RankedStock";
import { Pillar, PILLAR_ORDER, StockRanker } from "../../domain/service/StockRanker";
import { ReportMeta } from "../../application/port/ReportWriter";

interface StatusMeta {
  icon: string;
  text: string;
  bg: string;
  label: string;
}

const STATUS_META: Record<FieldStatus, StatusMeta> = {
  good: { icon: "✅", text: "text-success", bg: "bg-success", label: "Good" },
  caution: { icon: "⚠️", text: "text-warning", bg: "bg-warning", label: "Caution" },
  weak: { icon: "❌", text: "text-danger", bg: "bg-danger", label: "Weak" },
  na: { icon: "—", text: "text-muted", bg: "bg-secondary", label: "N/A" },
};

const BOOTSTRAP_CSS = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css";
const BOOTSTRAP_JS = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js";

/** Pure: turns analysis results into a self-contained Bootstrap HTML document. */
export class HtmlReportRenderer {
  constructor(private readonly ranker: StockRanker) {}

  render(results: AnalysisResult[], generatedLabel: string, meta: ReportMeta): string {
    const analyses = results.filter((r): r is StockAnalysis => !isFailed(r));
    const ranked = this.ranker.rank(analyses); // weakest first
    const scoreByTicker = new Map(ranked.map((r) => [r.analysis.ticker, r.score]));
    const us = results.filter((r) => r.market === "US");
    const br = results.filter((r) => r.market === "BR");
    const cacheBadge = meta.fetchEnabled
      ? '<span class="badge text-bg-success">fetch on</span>'
      : '<span class="badge text-bg-secondary">read-only (cache)</span>';

    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Stock Analysis — ${this.esc(generatedLabel)}</title>
<link href="${BOOTSTRAP_CSS}" rel="stylesheet">
<style>
  .field-table th { font-weight: 400; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .st { text-align: center; width: 34px; }
  .grp td { background:#f1f3f5; font-weight:600; font-size:.75rem; text-transform:uppercase; letter-spacing:.03em; }
  .pill { display:inline-block; width:12px; height:12px; border-radius:2px; margin-right:1px; }
  .formula-box { background:#f8f9fa; border:1px solid #dee2e6; border-radius:.5rem; }
</style></head>
<body class="bg-body-tertiary">
<header class="bg-dark text-white py-4 mb-4">
  <div class="container">
    <h1 class="h3 mb-1">📊 Stock Fundamental Analysis</h1>
    <div class="small text-secondary">
      Generated ${this.esc(generatedLabel)} · ${results.length} tickers ·
      source ${this.esc(meta.source)} · cache ${this.esc(meta.cacheDate)} ${cacheBadge}
    </div>
  </div>
</header>
<div class="container pb-5">
  <ul class="nav nav-tabs mb-4" role="tablist">
    <li class="nav-item"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-main" type="button">📊 Overview &amp; Formula</button></li>
    <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-us" type="button">🇺🇸 US stocks</button></li>
    <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-br" type="button">🇧🇷 BR stocks</button></li>
  </ul>
  <div class="tab-content">
    <div class="tab-pane fade show active" id="tab-main">
      ${this.ranking(ranked)}
      ${this.formula(ranked)}
      ${this.fieldIndex()}
    </div>
    <div class="tab-pane fade" id="tab-us">
      <h2 class="h5 my-3">🇺🇸 US stocks</h2>
      ${this.cardsGrid(us, scoreByTicker)}
    </div>
    <div class="tab-pane fade" id="tab-br">
      <h2 class="h5 my-3">🇧🇷 BR stocks</h2>
      ${this.cardsGrid(br, scoreByTicker)}
    </div>
  </div>
  <div class="alert alert-warning small mt-4 mb-0">
    ⚠️ <strong>Educational analysis, not financial advice.</strong> Values come from the
    selected source and may be incomplete or stale; fields marked N/A were unavailable.
    Verify against live data before investing.
  </div>
</div>
<script src="${BOOTSTRAP_JS}"></script>
</body></html>`;
  }

  // ---- Overview tab ----

  private ranking(ranked: RankedStock[]): string {
    if (!ranked.length) return `<div class="alert alert-info">No analyzed stocks (cache empty? run with STOCKS_FETCH=1).</div>`;
    const rows = ranked
      .map((r) => {
        const s = r.analysis;
        const o = STATUS_META[this.overallOf(s)];
        return `<tr>
        <td class="text-center text-muted fw-semibold">${r.position}</td>
        <td class="fw-semibold">${this.esc(s.ticker)}</td>
        <td>${marketLabel(s.market)}</td>
        <td><span class="badge ${this.scoreBg(r.score)}">${r.score}</span></td>
        <td><div class="d-flex flex-wrap gap-1">${this.pillarBadges(s)}</div></td>
        <td class="num">${this.esc(s.fields.roe.value)}</td>
        <td class="num">${this.esc(s.fields.roic.value)}</td>
        <td><span class="badge ${o.bg}">${o.icon} ${o.label}</span></td>
      </tr>`;
      })
      .join("\n");
    return `<section class="card shadow-sm mb-4"><div class="card-body">
      <h2 class="h5 card-title">🏆 Ranking — Fundamental Strength Score (weakest first)</h2>
      <p class="text-muted small">0–100, weakest at the top. The "Pillars" column shows each pillar's own 0–100 score (Prof · Debt · Val · Grw · Eff); grey "—" = no data.</p>
      <div class="table-responsive"><table class="table table-sm table-hover align-middle">
        <thead><tr><th class="text-center">#</th><th>Ticker</th><th>Market</th><th>FSS</th><th>Pillars</th><th class="num">ROE</th><th class="num">ROIC</th><th>Overall</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div></section>`;
  }

  private formula(ranked: RankedStock[]): string {
    const w = this.ranker.weights;
    const total = PILLAR_ORDER.reduce((sum, p) => sum + w[p], 0);
    const weightRows = PILLAR_ORDER.map(
      (p) =>
        `<tr><th class="fw-normal">${this.esc(this.pillarLabel(p))}</th>
       <td class="text-center">${w[p]}</td>
       <td class="text-muted small">${this.esc(this.pillarFieldLabels(p))}</td></tr>`,
    ).join("\n");

    // Live worked example: the strongest stock in the report.
    const best = ranked.length ? ranked[ranked.length - 1] : null;
    let example = "";
    if (best) {
      const bd = this.ranker.breakdown(best.analysis).filter((b) => b.score !== null);
      const exRows = bd
        .map(
          (b) =>
            `<tr><td>${this.esc(this.pillarLabel(b.pillar))}</td><td class="text-center">${b.weight}</td>
         <td class="text-center">${(b.score as number).toFixed(2)}</td>
         <td class="text-center">${b.weight} × ${(b.score as number).toFixed(2)} = <strong>${(b.weight * (b.score as number)).toFixed(1)}</strong></td></tr>`,
        )
        .join("\n");
      const earned = bd.reduce((sum, b) => sum + b.weight * (b.score as number), 0);
      const wsum = bd.reduce((sum, b) => sum + b.weight, 0);
      example = `<div class="col-lg-7">
        <h3 class="h6">Worked example — ${this.esc(best.analysis.ticker)} (strongest in this report)</h3>
        <table class="table table-sm align-middle">
          <thead><tr><th>Pillar</th><th class="text-center">Weight</th><th class="text-center">Score (0–1)</th><th class="text-center">Contribution</th></tr></thead>
          <tbody>${exRows}</tbody>
        </table>
        <p class="small mb-0">FSS = Σ contributions ÷ Σ weights × 100 = ${earned.toFixed(1)} ÷ ${wsum} × 100 =
          <span class="badge ${this.scoreBg(best.score)}">${best.score}</span></p>
      </div>`;
    }

    return `<section class="card shadow-sm mb-4"><div class="card-body">
      <h2 class="h5 card-title">🧮 Fundamental Strength Score — how it works</h2>
      <p class="mb-2">Each scored field gets a graded <strong>0–1</strong> by how good its value is. A pillar's
        score is the average of its fields. The FSS weights the pillars and rescales to 0–100 (GARP — valuation included):</p>
      <div class="formula-box p-3 mb-3 font-monospace small">
        pillarScore = avg(field 0–1 scores) &nbsp; · &nbsp;
        <strong>FSS = Σ(weight × pillarScore) ÷ Σ(weight) × 100</strong><br>
        field status badge: ≥0.66 ✅ &nbsp; ≥0.33 ⚠️ &nbsp; else ❌ &nbsp; (no data → —, pillar skipped &amp; weights renormalized)
      </div>
      <div class="row g-4">
        <div class="col-lg-5">
          <h3 class="h6">Pillar weights (total ${total}) — configurable</h3>
          <table class="table table-sm"><thead><tr><th>Pillar</th><th class="text-center">Weight</th><th>Fields</th></tr></thead>
            <tbody>${weightRows}</tbody></table>
        </div>
        ${example}
      </div>
    </div></section>`;
  }

  private fieldIndex(): string {
    const rows = FIELD_GROUPS.flatMap((g) => [
      `<tr class="grp"><td colspan="4">${this.esc(g.labelEn)} · ${this.esc(g.labelPt)}</td></tr>`,
      ...FIELD_DEFINITIONS.filter((d) => d.group === g.group).map(
        (d) =>
          `<tr><th class="fw-normal">${this.esc(d.labelEn)} <span class="text-muted">(${this.esc(d.labelPt)})</span></th>
         <td>${this.esc(d.meaning)}</td><td class="fst-italic text-muted small">${this.esc(d.example)}</td>
         <td class="text-center">${this.ranker.isScored(d.key) ? "✓" : ""}</td></tr>`,
      ),
    ]).join("\n");
    return `<section class="card shadow-sm mb-4"><div class="card-body">
      <h2 class="h5 card-title">📑 Index of indicators</h2>
      <p class="text-muted small">English + pt-BR labels. ✓ = used in the score.</p>
      <div class="table-responsive"><table class="table table-sm">
        <thead><tr><th>Indicator</th><th>What it means</th><th>Example</th><th class="text-center">Scored</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div></section>`;
  }

  // ---- US / BR tabs ----

  private cardsGrid(results: AnalysisResult[], scores: Map<string, number>): string {
    if (!results.length) return `<p class="text-muted">None.</p>`;
    const cards = results.map((r) => this.card(r, scores)).join("\n");
    return `<div class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">${cards}</div>`;
  }

  private card(result: AnalysisResult, scores: Map<string, number>): string {
    return isFailed(result) ? this.failedCard(result) : this.stockCard(result, scores.get(result.ticker));
  }

  private failedCard(r: FailedAnalysis): string {
    const notCached = /not cached/i.test(r.error);
    const cls = notCached ? "border-secondary" : "border-danger";
    const msg = notCached ? "Not in cache" : "Analysis failed";
    return `<div class="col"><div class="card h-100 ${cls}">
      <div class="card-body">
        <h5 class="card-title">${this.esc(r.ticker)} <small class="text-muted">${marketLabel(r.market)}</small></h5>
        <p class="${notCached ? "text-muted" : "text-danger"} small mb-0">${msg}: ${this.esc(r.error)}</p>
      </div></div></div>`;
  }

  private stockCard(s: StockAnalysis, score?: number): string {
    const o = STATUS_META[this.overallOf(s)];
    const body = FIELD_GROUPS.flatMap((g) => [
      `<tr class="grp"><td colspan="3">${this.esc(g.labelEn)} · ${this.esc(g.labelPt)}</td></tr>`,
      ...FIELD_DEFINITIONS.filter((d) => d.group === g.group).map((d) => {
        const f = s.fields[d.key as FieldKey];
        const meta = STATUS_META[this.fieldStatus(d.key, f)];
        return `<tr><th>${this.esc(d.labelEn)} <span class="text-muted">(${this.esc(d.labelPt)})</span></th>
          <td class="num">${this.esc(f?.value ?? "N/A")}</td><td class="st ${meta.text}">${meta.icon}</td></tr>`;
      }),
    ]).join("\n");
    const scoreBadge = score === undefined ? "" : `<span class="badge ${this.scoreBg(score)}">FSS ${score}/100</span>`;
    return `<div class="col"><div class="card h-100 shadow-sm">
      <div class="card-body">
        <h5 class="card-title mb-1">${this.esc(s.ticker)} <small class="text-muted fs-6">${this.esc(s.company)}</small></h5>
        <div class="small text-muted mb-2">${marketLabel(s.market)} · ${this.esc(s.sector)} · ${this.esc(s.currency)}
          <span class="badge ${o.bg}">${o.icon} ${o.label}</span> ${scoreBadge}</div>
        <div class="mb-2">${this.profiles(s.profiles)}</div>
        <div class="small text-muted">Pillar scores</div>
        <div class="mb-2 d-flex flex-wrap gap-1">${this.pillarBadges(s)}</div>
        <table class="table table-sm field-table mb-2"><tbody>${body}</tbody></table>
        <p class="small mb-0"><strong>Verdict:</strong> ${this.esc(s.verdict)}</p>
      </div></div></div>`;
  }

  // ---- helpers ----

  /** Field status computed from the configured scored-set: scored+numeric → graded band;
   *  otherwise the stored status (LLM fallback) or N/A. */
  private fieldStatus(key: FieldKey, f?: StockField): FieldStatus {
    if (f && f.numeric !== undefined && this.ranker.isScored(key)) {
      const sc = this.ranker.fieldScore(key, f.numeric);
      if (Number.isFinite(sc)) return this.ranker.statusFromScore(sc);
    }
    return f?.status ?? "na";
  }

  /** Overall recomputed from scored fields so it reflects the current config. */
  private overallOf(s: StockAnalysis): FieldStatus {
    const statuses = FIELD_DEFINITIONS.map((d) => this.fieldStatus(d.key, s.fields[d.key])).filter(
      (st) => st !== "na",
    );
    if (!statuses.length) return "na";
    if (statuses.every((st) => st === "good")) return "good";
    const weak = statuses.filter((st) => st === "weak").length;
    return weak * 2 >= statuses.length ? "weak" : "caution";
  }

  /** Per-pillar 0–100 score badges (abbreviated label + number, colored by band). */
  private pillarBadges(analysis: StockAnalysis): string {
    return this.ranker
      .breakdown(analysis)
      .map((b) => {
        const v = b.score === null ? null : Math.round(b.score * 100);
        const cls =
          v === null ? "text-bg-secondary" : v >= 66 ? "text-bg-success" : v >= 33 ? "text-bg-warning" : "text-bg-danger";
        const title = `${this.pillarLabel(b.pillar)} — weight ${b.weight}`;
        return `<span class="badge ${cls}" title="${this.esc(title)}">${this.pillarAbbrev(b.pillar)} ${v === null ? "—" : v}</span>`;
      })
      .join(" ");
  }

  private pillarAbbrev(pillar: Pillar): string {
    return { profitability: "Prof", debt: "Debt", valuation: "Val", growth: "Grw", efficiency: "Eff" }[pillar] ?? pillar;
  }

  private pillarLabel(pillar: Pillar): string {
    const g = FIELD_GROUPS.find((x) => x.group === (pillar as FieldGroup));
    return g ? `${g.labelEn} (${g.labelPt})` : pillar;
  }

  private pillarFieldLabels(pillar: Pillar): string {
    const keys = this.ranker.fieldsByPillar[pillar];
    return FIELD_DEFINITIONS.filter((d) => keys.includes(d.key))
      .map((d) => d.labelEn)
      .join(", ");
  }

  private profiles(profiles: StockProfile[]): string {
    if (!profiles.length) return '<span class="text-muted">—</span>';
    return profiles
      .map((p) => `<span class="badge text-bg-light border">${this.esc(profileLabel(p))}</span>`)
      .join(" ");
  }

  private scoreBg(score: number): string {
    if (score >= 70) return "bg-success";
    if (score >= 45) return "bg-warning";
    return "bg-danger";
  }

  private esc(value: unknown): string {
    return String(value ?? "").replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string,
    );
  }
}
