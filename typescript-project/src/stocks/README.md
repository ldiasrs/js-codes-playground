# 📊 Stocks — Fundamental Analysis Report Generator

Reads a watchlist of stocks (US + Brazil), analyzes each ticker against the **Status
Invest indicator set** (~30 indicators), ranks them by a **Fundamental Strength Score
(FSS)**, and produces a **Bootstrap HTML report**. **Cache-only by default** — it serves
the day's cached data and only fetches when you ask.

Analysis **sources**, chosen **per market**:
- **📈 Data sources (no AI)** — 🇧🇷 BR scrapes **statusinvest.com.br** (default, no key,
  full indicator set) or **fundamentus.com.br** / **brapi**; 🇺🇸 US uses **Financial
  Modeling Prep** (free key). Real fundamentals (ROE, ROIC, margins, debt, growth, …).
- **🖥️ Local CLI (no API key)** — `claude-cli` / `gemini-cli` (existing CLI login).
- **🔌 LLM HTTP API (needs a key)** — `claude` / `gemini` / `openai`.

Default config: **BR = `statusinvest`, US = `claude-cli`**. Built with a **hexagonal
(ports & adapters)** architecture — each source is an adapter behind the `StockAnalyzer`
port; ranking/scoring live entirely in the domain.

## What it does

1. Loads a watchlist from `data/stocks/stocks-list.json` (or tickers passed as CLI args).
2. **Auto-detects the market** per ticker (digit-suffix → 🇧🇷 BRL, letters → 🇺🇸 USD).
3. Reads ~30 indicators grouped into **Valuation · Debt · Efficiency · Profitability ·
   Growth**, each shown with **English + pt-BR labels** (e.g. "Net Debt/EBITDA · Dív. líquida/EBITDA").
4. **Ranks** by the **Fundamental Strength Score (FSS)** — a graded, multi-pillar 0–100
   score (configurable weights, GARP), shown weakest-first.
5. Writes a **Bootstrap** report to `data/stocks/reports/<YYYY-MM-DD-HHMM>/` with three tabs:
   - **📊 Overview & Formula** — 🏆 FSS ranking, the indicator index, and the rating
     formula (weights + a live worked example).
   - **🇺🇸 US stocks** / **🇧🇷 BR stocks** — cards with grouped fields, status ✅/⚠️/❌, FSS badge.
   - Plus `data.json` — raw results (incl. numeric values), for auditing or re-rendering.

### Daily cache

Each ticker's analysis is cached for the day in `data/stocks/cache/<YYYY-MM-DD>.v2.json`
(keyed by `source:market:ticker`). **Fetching is OFF by default (cache-only).** A
cached ticker is read from JSON and the source — AI / API / scrape — is **never called**.
To fetch fresh data (and populate the cache), run with `STOCKS_FETCH=1`; an uncached
ticker in cache-only mode renders a "not cached" card. The filename is the date, so the
cache expires daily. The rating formula (`StockRanker`) always **recomputes in code** from
the cached numbers — change `fss_weights` and re-run and scores update without re-fetching.
The report header shows the cache date + a read-only badge; the run prints
`Cache (mode, date): N hit(s), M fetched/not-cached`.

> **First run:** with fetching off and an empty cache everything is "not cached". Run once
> with `STOCKS_FETCH=1` to populate, then normal runs serve from cache.

> ⚠️ **Educational, not financial advice.** Data depends on the provider's
> freshness/coverage; the BR scrapers (Status Invest / Fundamentus) depend on page
> layouts that can change; AI sources estimate from training data (may be stale).
> Unknown values are `N/A`. Verify before acting.

## Architecture (ports & adapters)

The dependency rule points inward: **domain ← application ← adapters**. The domain
knows nothing about HTTP, files, or providers; adapters depend on ports, never the
reverse. Swapping Claude for Gemini, or HTML output for PDF, is a new adapter — no
domain change.

```
src/stocks/
├── domain/                         # pure business core (no IO)
│   ├── model/                      # Stock, Market, FieldDefinition, StockAnalysis, RankedStock, …
│   └── service/                    # MarketDetector, PromptBuilder, StockAnalysisParser,
│                                   #   StockRanker (FSS, weights), FieldScorer (graded bands)
├── application/                    # use cases + ports (the hexagon boundary)
│   ├── port/                       # AnalyzeStocksUseCase (driving) + driven ports:
│   │                               #   StockAnalyzer, AnalysisCache, LlmGateway,
│   │                               #   StockListProvider, PromptProvider, ReportWriter, Clock, Logger
│   ├── support/                    # concurrency helper
│   └── AnalyzeStocksService.ts     # orchestrates the ports
├── adapter/
│   ├── cli/                        # StockAnalysisCli            (driving adapter)
│   ├── analyzer/                   # StatusInvest/Fundamentus/Fmp/Brapi/Llm + MarketRouting + Caching + Factory
│   ├── cache/                      # FileDailyAnalysisCache (per-day JSON)
│   ├── llm/                        # Anthropic / Gemini / OpenAI (API) + Cli gateways + factory
│   ├── persistence/                # File watchlist + prompt providers
│   ├── report/                     # HtmlReportRenderer (Bootstrap, pure) + HtmlReportWriter (IO)
│   ├── config/                     # StockAnalysisConfig (per-market source + env resolution)
│   ├── time/ , logging/            # SystemClock, ConsoleLogger
└── main.ts                         # composition root — wires everything, runs the CLI
```

The use case depends only on the `StockAnalyzer` port. To add a data source:
implement `StockAnalyzer` (like `BrapiStockAnalyzer`) and wire it in `main.ts`.
To add an AI provider: implement `LlmGateway`. To change output: implement `ReportWriter`.

## Requirements

- **Node 18+** (developed on Node 22) and `ts-node` (already a dev dependency).
- **BR (`statusinvest`)**: nothing — scraped (no key). Cloudflare-protected; if blocked,
  set `STATUSINVEST_COOKIE` (see Configuration) or fall back to `fundamentus`.
- **US (`fmp`)**: a free FMP key → https://site.financialmodelingprep.com.
- `claude-cli` / `gemini-cli`: that CLI installed and logged in (no API key).
- LLM API sources (`claude` / `gemini` / `openai`): an API key.

## Configuration

Config lives under `stock_analysis` in `config/global-config.prod.json`
(see `config/global-config.sample.json`). The **source is per market**; fetching is **off
by default**; the **FSS pillar weights are configurable**:

```json
"stock_analysis": {
  "default_source": "api",
  "fetch_enabled": false,
  "sources_by_market": { "BR": "statusinvest", "US": "claude-cli" },
  "fss_weights": { "profitability": 30, "debt": 20, "valuation": 20, "growth": 15, "efficiency": 15 },
  "providers": {
    "statusinvest": { "cookie": "" },
    "brapi":      { "token": "..." },
    "fmp":        { "api_key": "..." },
    "claude-cli": { "command": "claude", "model": "" },
    "claude":     { "api_key": "...", "model": "claude-opus-4-8" }
  }
}
```

Each market's source is one of:

| Source | Data | Needs |
|--------|------|-------|
| `api` | market default: BR→Status Invest, US→FMP | (per below) |
| `statusinvest` | BR scrape — full indicator set (~30) | nothing (Cloudflare; optional cookie) |
| `fundamentus` | BR scrape — most indicators + computed | nothing |
| `fmp` | US FMP `stable/` ratios + key-metrics + growth + profile | free key |
| `brapi` | BR brapi.dev (free tier ≈ P/E only) | token |
| `claude-cli` / `gemini-cli` | local CLI (knowledge-limited for small-caps) | CLI logged in |
| `claude` / `gemini` / `openai` | LLM HTTP API | API key |

> ℹ️ LLM sources answer from training knowledge — fine for well-known names, but
> **small-caps often come back `N/A`**. Use a data source for reliable numbers.

Per-market precedence (highest first):
**`STOCKS_SOURCE_<MKT>` → `sources_by_market.<MKT>` → `STOCKS_SOURCE` → `default_source` → `api`.**

| Env var | Effect |
|---------|--------|
| `STOCKS_FETCH` | `1`/`true` to **enable fetching** (default off = cache-only) |
| `STOCKS_SOURCE_BR` / `STOCKS_SOURCE_US` | Per-market source override (highest precedence) |
| `STOCKS_SOURCE` | Global source for both markets |
| `STATUSINVEST_COOKIE` | Browser cookie (with `cf_clearance`) if Status Invest is Cloudflare-blocked — **never commit it** (expires ~30 min, IP-bound) |
| `BRAPI_TOKEN` / `FMP_API_KEY` | Override the finance-API credentials |
| `STOCKS_MODEL` | Override the model id (LLM sources) |
| `STOCKS_CONCURRENCY` | Parallel analyses (default `4`) — lower for free-tier rate limits |
| `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` / `OPENAI_API_KEY` | Override an LLM source's key |

### Rating formula (FSS)

Each scored field gets a graded **0–1** by how good its value is; a pillar's score is the
average of its fields; `FSS = Σ(weight × pillarScore) ÷ Σ(weight) × 100` (weakest-first).
Default weights — **Profitability 30 · Debt/Health 20 · Valuation 20 · Growth 15 · Efficiency 15** —
tune them via `fss_weights` (the Overview tab's formula always shows the configured weights
and a live worked example). e.g. WEGE3 ≈ **72** (elite quality/growth, expensive valuation).

## Usage

```bash
cd <project-root>   # .../typescript-project

# Cache-only (default) — serves today's cache; uncached tickers show "not cached"
npm run stocks-analyze

# Fetch fresh data and populate the cache (BR=Status Invest, US=claude-cli by default)
STOCKS_FETCH=1 npm run stocks-analyze

# Specific tickers (market auto-detected)
STOCKS_FETCH=1 npm run stocks-analyze -- JPM ITUB4 SHUL4

# Override sources / Status Invest cookie if Cloudflare-blocked
STOCKS_FETCH=1 STOCKS_SOURCE_US=fmp FMP_API_KEY=yyy npm run stocks-analyze
STOCKS_FETCH=1 STATUSINVEST_COOKIE="cf_clearance=...; ..." npm run stocks-analyze

# Or call ts-node directly
npx ts-node --project tsconfig.node.json src/stocks/main.ts AAPL VALE3
```

## Example input

`data/stocks/stocks-list.json`:

```json
{
  "US": ["JPM", "JNJ", "XOM", "CSCO"],
  "BR": ["WEGE3", "ITUB4", "SHUL4", "SEER3"]
}
```

## Example output

Console (fetch run):

```
Analyzing 3 tickers via BR=statusinvest, US=claude-cli (concurrency 2)...
  ✓ WEGE3
  ✓ SHUL4
  ✓ SEER3
Report written: data/stocks/reports/2026-06-27-1015/report.html
Cache (fetch on, 2026-06-27): 0 hit(s), 3 fetched → data/stocks/cache/2026-06-27.v2.json
```

`data/stocks/reports/<timestamp>/data.json` (one entry per ticker; fields carry
`value` + `numeric` + `status`):

```json
{
  "kind": "analysis",
  "ticker": "WEGE3",
  "company": "WEG ON",
  "market": "BR",
  "currency": "BRL",
  "fields": {
    "roe":           { "value": "35,43%", "numeric": 35.43, "status": "good" },
    "roic":          { "value": "28,32%", "numeric": 28.32, "status": "good" },
    "netDebtEbitda": { "value": "-0,37",  "numeric": -0.37, "status": "good" },
    "pl":            { "value": "31,31",  "numeric": 31.31, "status": "weak" }
  },
  "verdict": "From statusinvest.com.br. 30/30 indicators scraped.",
  "overall": "caution"
}
```

## The indicator set

~30 indicators in 5 groups, each with English + pt-BR labels: **Valuation** (D.Y, P/L,
PEG, P/VP, EV/EBITDA, …), **Debt** (Dív. líquida/EBITDA, Liq. corrente, Passivos/Ativos,
…), **Efficiency** (M. Bruta/EBITDA/EBIT/Líquida), **Profitability** (ROE, ROA, ROIC,
Giro ativos), **Growth** (CAGR Receitas/Lucros 5 anos).

Scored fields get a graded 0–1 (✅/⚠️/❌ badge); display-only fields just show their value.
Definitions, labels and which fields are scored live in `domain/model/FieldDefinition.ts`;
score bands in `domain/service/FieldScorer.ts`; pillar weights in `StockRanker` (config-overridable).
The LLM JSON contract is in `stock-analysis-prompt.md`.
