# 📊 Stocks — Fundamental Analysis Report Generator

Reads a watchlist of stocks (US + Brazil), runs each ticker through an LLM using
the fundamental-analysis prompt, and produces a **concise HTML report** with a
status table per stock, a comparison table, and an index of every field.

Two ways to reach a model:
- **Local CLI (no API key)** — `claude-cli` / `gemini-cli` shell out to the
  installed Claude Code / Gemini CLI and use *its* existing login. **Default:
  `claude-cli`.**
- **HTTP API (needs a key)** — `claude` / `gemini` / `openai`.

Built with a **hexagonal (ports & adapters) architecture** in TypeScript.

## What it does

1. Loads a watchlist from `data/stocks/stocks-list.json` (or tickers passed as CLI args).
2. **Auto-detects the market** per ticker:
   - Ends in a digit → 🇧🇷 **Brazil (B3)**, valued in **BRL** (e.g. `ITUB4`, `GOLD11`).
   - Letters only → 🇺🇸 **US**, valued in **USD** (e.g. `JPM`, `JNJ`).
3. Asks the model to score 13 fundamental fields (P/E, ROE, Dividend Yield, Debt/Equity…),
   classify each stock into profiles (🛡️ Solid · 📈 Growth · 💰 Dividend), and give a verdict.
4. **Ranks** every stock 0–100 on the fields that define a *solid* stock (moat, low
   debt, free cash flow, and returns weigh most), shown weakest-first so the riskiest
   surface at the top.
5. Writes a report to `data/stocks/reports/<YYYY-MM-DD-HHMM>/`:
   - `report.html` — 🏆 ranking table (weakest first) + US/BR cards (status ✅/⚠️/❌
     per field, with a 0–100 score badge) + field index.
   - `data.json` — raw results, for auditing or re-rendering.

> ⚠️ **Educational, not financial advice.** The model has no live market feed — figures
> are estimates from training data and may be stale or wrong (unknown values are marked
> `N/A`). Verify against a real data source before acting.

## Architecture (ports & adapters)

The dependency rule points inward: **domain ← application ← adapters**. The domain
knows nothing about HTTP, files, or providers; adapters depend on ports, never the
reverse. Swapping Claude for Gemini, or HTML output for PDF, is a new adapter — no
domain change.

```
src/stocks/
├── domain/                         # pure business core (no IO)
│   ├── model/                      # Stock, Market, FieldDefinition, StockAnalysis, …
│   └── service/                    # MarketDetector, PromptBuilder, StockAnalysisParser, StockRanker
├── application/                    # use cases + ports (the hexagon boundary)
│   ├── port/                       # AnalyzeStocksUseCase (driving) + driven ports:
│   │                               #   LlmGateway, StockListProvider, PromptProvider,
│   │                               #   ReportWriter, Clock, Logger
│   ├── support/                    # concurrency helper
│   └── AnalyzeStocksService.ts     # orchestrates the ports
├── adapter/
│   ├── cli/                        # StockAnalysisCli            (driving adapter)
│   ├── llm/                        # Anthropic / Gemini / OpenAI (API) + Cli gateways + factory
│   ├── persistence/                # File watchlist + prompt providers
│   ├── report/                     # HtmlReportRenderer (pure) + HtmlReportWriter (IO)
│   ├── config/                     # StockAnalysisConfig (config + env resolution)
│   ├── time/ , logging/            # SystemClock, ConsoleLogger
└── main.ts                         # composition root — wires everything, runs the CLI
```

To add a provider: implement `LlmGateway`, register it in `LlmGatewayFactory`. To
change the output format: implement `ReportWriter`. Nothing else moves.

## Requirements

- **Node 18+** (developed on Node 22) and `ts-node` (already a dev dependency).
- For the **default** (`claude-cli`): the `claude` CLI installed and logged in — **no API key**.
- For `gemini-cli`: the `gemini` CLI installed and logged in.
- For the API providers (`claude` / `gemini` / `openai`): an API key.

## Configuration

Providers live under `stock_analysis` in `config/global-config.prod.json`
(see `config/global-config.sample.json`). **Default provider is `claude-cli`** —
keyless, via the local Claude CLI.

```json
"stock_analysis": {
  "default_provider": "claude-cli",
  "providers": {
    "claude-cli": { "command": "claude", "model": "" },
    "gemini-cli": { "command": "gemini", "model": "" },
    "claude":     { "api_key": "...", "model": "claude-opus-4-8" },
    "gemini":     { "api_key": "...", "model": "gemini-2.5-flash" },
    "openai":     { "api_key": "...", "model": "gpt-4o-mini" }
  }
}
```

CLI providers run the prompt **asynchronously** (each ticker spawns the CLI;
`STOCKS_CONCURRENCY` bounds parallelism). An empty `model` uses the CLI's own
default; set it to pin one. Per-provider keys you can tweak: `command`, `args`,
`model_flag`, `prompt_via` (`"arg"` | `"stdin"`).

Resolution precedence (highest first): **env var → config file → built-in default**.

| Env var | Effect |
|---------|--------|
| `STOCKS_PROVIDER` | `claude-cli` \| `gemini-cli` \| `claude` \| `gemini` \| `openai` |
| `STOCKS_MODEL` | Override the model id |
| `STOCKS_CONCURRENCY` | Parallel analyses (default `4`) |
| `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` / `OPENAI_API_KEY` | Override an API provider's key |

## Usage

```bash
cd <project-root>   # .../typescript-project

# Whole watchlist with the default provider (claude-cli — no API key)
npm run stocks-analyze

# Specific tickers (market auto-detected)
npm run stocks-analyze -- JPM ITUB4 VALE3

# Pick a provider / model
STOCKS_PROVIDER=gemini-cli npm run stocks-analyze              # keyless, local Gemini CLI
STOCKS_PROVIDER=claude STOCKS_MODEL=claude-opus-4-8 npm run stocks-analyze   # HTTP API (needs key)
STOCKS_PROVIDER=openai STOCKS_MODEL=gpt-4o npm run stocks-analyze

# Or call ts-node directly
npx ts-node --project tsconfig.node.json src/stocks/main.ts AAPL VALE3
```

## Example input

`data/stocks/stocks-list.json`:

```json
{
  "US": ["JPM", "JNJ", "XOM", "CSCO"],
  "BR": ["ITUB4", "WEGE3", "AGRO3", "GOLD11"]
}
```

## Example output

Console:

```
Analyzing 8 tickers with claude-cli/claude (cli default) (concurrency 4)...
  ✓ JPM
  ✓ ITUB4
  ...
Report written: data/stocks/reports/2026-05-21-1001/report.html
```

`data/stocks/reports/<timestamp>/data.json` (one entry per ticker):

```json
{
  "kind": "analysis",
  "ticker": "ITUB4",
  "company": "Itaú Unibanco",
  "market": "BR",
  "currency": "BRL",
  "sector": "Banking",
  "profiles": ["solid", "dividend"],
  "fields": {
    "pe":            { "value": "8.5",  "status": "good" },
    "dividendYield": { "value": "6.2%", "status": "good" },
    "roe":           { "value": "20%",  "status": "good" },
    "debtEquity":    { "value": "N/A",  "status": "na" }
  },
  "verdict": "Solid, profitable bank with an attractive, sustainable dividend.",
  "overall": "good"
}
```

## The 13 analyzed fields

P/E · PEG · P/B · Dividend Yield · Payout Ratio · ROE · Net Margin · Debt/Equity ·
Current Ratio · Free Cash Flow · Revenue Growth (YoY) · EPS Growth · Moat.

Each gets a status: ✅ good · ⚠️ caution · ❌ weak · — N/A. Thresholds live in one
place — `domain/model/FieldDefinition.ts` — and drive both parsing and the report's
**Index of fields**. See `stock-analysis-prompt.md` for the prompt and JSON contract.
