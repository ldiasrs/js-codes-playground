import { FIELD_DEFINITIONS, FieldKey } from "../../domain/model/FieldDefinition";
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
import { StockRanker } from "../../domain/service/StockRanker";

interface StatusMeta {
  icon: string;
  cls: string;
  label: string;
}

const STATUS_META: Record<FieldStatus, StatusMeta> = {
  good: { icon: "✅", cls: "good", label: "Good" },
  caution: { icon: "⚠️", cls: "caution", label: "Caution" },
  weak: { icon: "❌", cls: "weak", label: "Weak" },
  na: { icon: "—", cls: "na", label: "N/A" },
};

/** Pure: turns analysis results into a self-contained HTML document. */
export class HtmlReportRenderer {
  private readonly ranker = new StockRanker();

  render(results: AnalysisResult[], generatedLabel: string, modelLabel: string): string {
    const analyses = results.filter((r): r is StockAnalysis => !isFailed(r));
    const ranked = this.ranker.rank(analyses); // weakest first
    const scoreByTicker = new Map(ranked.map((r) => [r.analysis.ticker, r.score]));

    const us = results.filter((r) => r.market === "US");
    const br = results.filter((r) => r.market === "BR");
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Stock Analysis — ${this.esc(generatedLabel)}</title>
<style>${this.css()}</style></head>
<body>
<header>
  <h1>📊 Stock Fundamental Analysis</h1>
  <p>Generated ${this.esc(generatedLabel)} · ${this.esc(modelLabel)} · ${results.length} tickers</p>
</header>
<main>
  ${this.ranking(ranked)}
  <h2>🇺🇸 US stocks</h2>
  <div class="grid">${us.map((r) => this.card(r, scoreByTicker)).join("\n") || "<p>None</p>"}</div>
  <h2>🇧🇷 Brazil stocks</h2>
  <div class="grid">${br.map((r) => this.card(r, scoreByTicker)).join("\n") || "<p>None</p>"}</div>
  ${this.fieldIndex()}
  <p class="disclaimer">⚠️ <strong>Educational analysis, not financial advice.</strong>
  Figures are produced by a language model and may be estimated, outdated, or wrong
  (fields marked N/A were unknown). Verify against live market data before investing.</p>
</main>
</body></html>`;
  }

  private card(result: AnalysisResult, scores: Map<string, number>): string {
    return isFailed(result) ? this.failedCard(result) : this.stockCard(result, scores.get(result.ticker));
  }

  private failedCard(r: FailedAnalysis): string {
    return `<section class="card err"><h2>${this.esc(r.ticker)} ${marketLabel(r.market)}</h2>
      <p class="errmsg">Analysis failed: ${this.esc(r.error)}</p></section>`;
  }

  private stockCard(s: StockAnalysis, score?: number): string {
    const rows = FIELD_DEFINITIONS.map((def) => {
      const field = s.fields[def.key as FieldKey];
      return `<tr><th>${this.esc(def.label)}</th>${this.valueCells(field)}</tr>`;
    }).join("\n");
    const overall = STATUS_META[s.overall];
    const scoreBadge =
      score === undefined ? "" : `<span class="score ${this.scoreClass(score)}">Score ${score}/100</span>`;
    return `<section class="card">
    <div class="card-head">
      <h2>${this.esc(s.ticker)} <span class="company">${this.esc(s.company)}</span></h2>
      <div class="meta">${marketLabel(s.market)} · ${this.esc(s.sector)} · ${this.esc(s.currency)}
        <span class="overall ${overall.cls}">${overall.icon} ${overall.label}</span>${scoreBadge}</div>
      <div class="profiles">${this.profiles(s.profiles)}</div>
    </div>
    <table class="fields">
      <thead><tr><th>Field</th><th>Value</th><th>St.</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="verdict"><strong>Verdict:</strong> ${this.esc(s.verdict)}</p>
  </section>`;
  }

  private ranking(ranked: RankedStock[]): string {
    if (!ranked.length) return "";
    const rows = ranked
      .map((r) => {
        const s = r.analysis;
        const overall = STATUS_META[s.overall];
        return `<tr>
        <td class="rank">${r.position}</td>
        <td><strong>${this.esc(s.ticker)}</strong></td>
        <td>${marketLabel(s.market)}</td>
        <td><span class="score ${this.scoreClass(r.score)}">${r.score}</span></td>
        <td>${this.profiles(s.profiles)}</td>
        <td>${this.esc(s.fields.roe.value)}</td>
        <td>${this.esc(s.fields.debtEquity.value)}</td>
        <td>${this.esc(s.fields.moat.value)}</td>
        <td class="st ${overall.cls}">${overall.icon} ${overall.label}</td>
      </tr>`;
      })
      .join("\n");
    return `<section class="comparison">
    <h2>🏆 Ranking — weakest first</h2>
    <p class="index-hint">Scored 0–100 on the fields that define a solid stock (moat, low debt, cash flow, returns weigh most). Worst at the top.</p>
    <table>
      <thead><tr><th>#</th><th>Ticker</th><th>Market</th><th>Score</th><th>Profile</th><th>ROE</th><th>Debt/Eq</th><th>Moat</th><th>Overall</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </section>`;
  }

  private scoreClass(score: number): string {
    if (score >= 70) return "good";
    if (score >= 45) return "caution";
    return "weak";
  }

  private fieldIndex(): string {
    const rows = FIELD_DEFINITIONS.map(
      (d) =>
        `<tr>
       <th>${this.esc(d.label)}</th>
       <td>${this.esc(d.meaning)}</td>
       <td class="example">${this.esc(d.example)}</td>
       <td class="good">${this.esc(d.good)}</td><td class="caution">${this.esc(d.caution)}</td><td class="weak">${this.esc(d.weak)}</td>
     </tr>`,
    ).join("\n");
    return `<section class="index">
    <h2>📑 Index of fields</h2>
    <p class="index-hint">What each metric means, a quick example, and the rule-of-thumb ranges.</p>
    <table>
      <thead><tr><th>Field</th><th>What it means</th><th>Example</th><th>✅ Good</th><th>⚠️ Caution</th><th>❌ Weak</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </section>`;
  }

  private valueCells(field: StockField | undefined): string {
    const meta = STATUS_META[field?.status ?? "na"];
    return `<td class="val">${this.esc(field?.value ?? "N/A")}</td><td class="st ${meta.cls}">${meta.icon}</td>`;
  }

  private profiles(profiles: StockProfile[]): string {
    if (!profiles.length) return "—";
    return profiles
      .map((p) => `<span class="badge ${this.esc(p)}">${this.esc(profileLabel(p))}</span>`)
      .join(" ");
  }

  private esc(value: unknown): string {
    return String(value ?? "").replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string,
    );
  }

  private css(): string {
    return `
  :root { --good:#16a34a; --caution:#d97706; --weak:#dc2626; --na:#9ca3af; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; margin: 0; background:#f6f7f9; color:#1f2937; }
  header { background:#111827; color:#fff; padding:24px 32px; }
  header h1 { margin:0 0 4px; font-size:22px; }
  header p { margin:0; color:#9ca3af; font-size:13px; }
  main { max-width:1100px; margin:0 auto; padding:24px 16px 60px; }
  h2 { font-size:17px; margin:28px 0 12px; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(330px,1fr)); gap:16px; }
  .card { background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:16px; }
  .card-head h2 { margin:0; font-size:18px; }
  .company { font-weight:400; color:#6b7280; font-size:13px; }
  .meta { font-size:12px; color:#6b7280; margin:4px 0 8px; }
  .overall { margin-left:6px; padding:1px 8px; border-radius:99px; font-weight:600; color:#fff; }
  .profiles { margin-bottom:8px; }
  .badge { display:inline-block; font-size:11px; padding:2px 8px; border-radius:99px; background:#eef2ff; color:#3730a3; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  .fields th { text-align:left; font-weight:500; color:#374151; padding:4px 6px; border-bottom:1px solid #f1f5f9; }
  .fields td { padding:4px 6px; border-bottom:1px solid #f1f5f9; }
  .fields .val { text-align:right; font-variant-numeric:tabular-nums; }
  .st { text-align:center; width:34px; }
  .good { color:var(--good); } .caution { color:var(--caution); } .weak { color:var(--weak); } .na { color:var(--na); }
  .overall.good { background:var(--good);} .overall.caution{background:var(--caution);} .overall.weak{background:var(--weak);} .overall.na{background:var(--na);}
  .verdict { font-size:12px; color:#374151; margin:10px 0 0; line-height:1.45; }
  .comparison table, .index table { background:#fff; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden; }
  .comparison th, .comparison td, .index th, .index td { padding:8px 10px; border-bottom:1px solid #f1f5f9; text-align:left; font-size:13px; }
  .comparison thead th, .index thead th { background:#f9fafb; }
  .index-hint { font-size:12px; color:#6b7280; margin:0 0 8px; }
  .index .example { color:#6b7280; font-style:italic; }
  .comparison .rank { text-align:center; font-weight:600; color:#6b7280; width:34px; }
  .score { display:inline-block; min-width:34px; text-align:center; padding:1px 8px; border-radius:99px; font-weight:600; color:#fff; font-size:12px; }
  .score.good { background:var(--good); } .score.caution { background:var(--caution); } .score.weak { background:var(--weak); }
  .meta .score { margin-left:6px; }
  .card.err { border-color:#fecaca; background:#fff5f5; }
  .errmsg { color:var(--weak); font-size:13px; }
  .disclaimer { margin-top:30px; font-size:12px; color:#6b7280; background:#fffbeb; border:1px solid #fde68a; padding:10px 14px; border-radius:8px; }`;
  }
}
