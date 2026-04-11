# Temporal Nexus Test — Brazilian Stock Portfolio Analysis

A production-quality Temporal workflow that orchestrates financial analysis for Brazilian stocks (B3). Built with TypeScript, clean architecture, and clear separation of concerns.

## Architecture

```
src/
├── domain/            ← Pure business logic, zero external dependencies
│   ├── types/         ← All domain types (Stock, Portfolio, Financial, Report)
│   └── services/      ← Pure calculation functions (P/L, returns)
│
├── application/       ← Use cases and port interfaces
│   ├── ports/         ← Interfaces for external data sources (StockDataProvider, NewsProvider)
│   └── use-cases/     ← Business orchestration (fetch data, calculate, aggregate)
│
├── infrastructure/    ← Replaceable external implementations
│   ├── providers/     ← Mock implementations of port interfaces
│   └── config.ts      ← Temporal connection settings
│
├── workflows/         ← Temporal workflow definitions (deterministic, no side effects)
├── activities/        ← Thin activity wrappers with dependency injection
├── shared/            ← Utilities, constants
├── worker.ts          ← Temporal worker process
└── client.ts          ← CLI client to trigger workflows
```

### Layer Responsibilities

| Layer | Responsibility | Rules |
|---|---|---|
| **Domain** | Types, business rules, financial calculations | No imports from other layers. Pure functions only. |
| **Application** | Use cases, port interfaces | Depends on domain. Defines interfaces that infrastructure must implement. |
| **Infrastructure** | External APIs, mock providers, config | Implements application port interfaces. Easily replaceable. |
| **Workflows** | Temporal orchestration | Deterministic. Calls activities via `proxyActivities`. No direct I/O. |
| **Activities** | Thin wrappers bridging Temporal ↔ use cases | Delegates all logic to application use cases. Receives dependencies via factory. |

### Dependency Flow

```
Workflow → Activities → Use Cases → Domain Services
                ↓
         Infrastructure (providers)
```

- **Workflows** never call infrastructure directly — they invoke activities
- **Activities** are thin: they receive injected providers and delegate to use cases
- **Use cases** call domain services and port interfaces
- **Infrastructure** is behind interfaces — swap mock for real API by implementing the port

### Temporal Patterns Used

- **`proxyActivities<Activities>()`** — type-safe activity calls from the workflow sandbox
- **Activity factory with dependency injection** — `createActivities(deps)` injects providers via closures (official Temporal TS SDK pattern)
- **Parallel execution** — `Promise.all` for independent data + news fetching
- **Retry policy** — 3 attempts, 1s initial interval, backoff coefficient 2
- **Task queue** — `portfolio-analysis`

## Workflow Pipeline

```
┌─────────────────────────────────────────────────────┐
│           portfolioAnalysisWorkflow(input)           │
│                                                     │
│  Step 1: Parallel Fetch                             │
│  ┌──────────────────┐  ┌─────────────────┐          │
│  │ fetchFinancialData│  │   fetchNews     │          │
│  │  (stock prices,  │  │ (recent news    │          │
│  │   indicators)    │  │  per ticker)    │          │
│  └────────┬─────────┘  └────────┬────────┘          │
│           └──────────┬──────────┘                    │
│                      ▼                               │
│  Step 2: calculateFinancials                        │
│  (P/L, monthly return, annualized return per stock) │
│                      │                               │
│                      ▼                               │
│  Step 3: aggregateReport                            │
│  (per-stock breakdown + portfolio summary)          │
│                      │                               │
│                      ▼                               │
│              PortfolioReport                         │
└─────────────────────────────────────────────────────┘
```

## Prerequisites

- **Node.js** ≥ 20
- **Temporal CLI** — install with:
  ```bash
  brew install temporal   # macOS
  # or: curl -sSf https://temporal.download/cli.sh | sh
  ```

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Build the project
npm run build

# 3. Copy and edit environment config (optional — defaults to localhost:7233)
cp .env.example .env
```

## Running

You need three terminals:

### Terminal 1 — Temporal Dev Server

```bash
temporal server start-dev
```

This starts:
- gRPC server on `localhost:7233`
- Web UI on `http://localhost:8233`

### Terminal 2 — Worker

```bash
npm run start:worker
```

The worker connects to Temporal and polls the `portfolio-analysis` task queue.

### Terminal 3 — Execute Workflow

```bash
npm run start:client
```

This starts a workflow with sample B3 stocks (PETR4, VALE3, ITUB4) and prints the report.

## Input Format

The workflow accepts a `PortfolioInput`:

```typescript
{
  stocks: [
    {
      ticker: "PETR4",       // B3 ticker symbol
      units: 200,            // number of shares
      purchasePrice: 32.50,  // price per share in BRL at purchase
      purchaseDate: "2025-06-15"  // ISO date
    },
    {
      ticker: "VALE3",
      units: 150,
      purchasePrice: 58.00,
      purchaseDate: "2025-03-20"
    }
  ],
  referenceDate: "2026-04-11",  // analysis date (defaults to today)
  operationCost: 45.90          // total brokerage/operation cost in BRL
}
```

## Output Format

The workflow returns a `PortfolioReport` with:

**Summary:**
- Total invested, current value, total P/L (absolute + %)
- Operation cost deducted → net P/L

**Per-stock breakdown:**
- Current price vs purchase price
- Absolute and percentage profit/loss
- Holding period in months
- Monthly and annualized return
- Financial indicators (P/E, dividend yield, EPS, P/B)
- Recent news headlines

### Example Output

```
--- SUMMARY ---
Reference Date:        2026-04-11
Number of Stocks:      3
Total Invested:        R$ 24,440.00
Total Current Value:   R$ 27,371.50
Total P/L:             R$ 2,931.50 (11.99%)
Operation Cost:        R$ 45.90
Net P/L:               R$ 2,885.60 (11.81%)

--- STOCK BREAKDOWN ---

  PETR4
    Purchase: R$ 32.50 → Current: R$ 38.72
    P/L: R$ 1,244.00 (+19.14%)
    Annualized Return: 26.30%
    Dividend Yield: 12.5%

  VALE3
    Purchase: R$ 58.00 → Current: R$ 62.45
    P/L: R$ 667.50 (+7.67%)
    Annualized Return: 7.67%
    Dividend Yield: 8.9%

  ITUB4
    Purchase: R$ 30.80 → Current: R$ 34.20
    P/L: R$ 1,020.00 (+11.04%)
    Annualized Return: 19.66%
    Dividend Yield: 5.2%
```

## Financial Calculations

| Metric | Formula |
|---|---|
| Absolute P/L | `(currentPrice - purchasePrice) × units` |
| Percentage P/L | `((currentPrice - purchasePrice) / purchasePrice) × 100` |
| Holding months | Calendar months between purchase date and reference date |
| Monthly return | `percentageProfitLoss / holdingMonths` |
| Annualized return | `((1 + percentageProfitLoss/100)^(12/holdingMonths) - 1) × 100` |

## Replacing Mock Providers with Real APIs

The mock providers are behind port interfaces. To use a real API:

1. Implement `StockDataProvider` (in `src/application/ports/stock-data-provider.ts`):

```typescript
// src/infrastructure/providers/brapi-stock-data-provider.ts
import { StockDataProvider } from '../../application/ports/stock-data-provider';
import { StockData } from '../../domain/types/stock';

export class BrapiStockDataProvider implements StockDataProvider {
  constructor(private apiKey: string) {}

  async fetchStockData(tickers: string[], referenceDate: string): Promise<StockData[]> {
    // Call brapi.dev API here
  }
}
```

2. Swap the provider in `src/worker.ts`:

```typescript
const activities = createActivities({
  stockDataProvider: new BrapiStockDataProvider(process.env.BRAPI_API_KEY!),
  newsProvider: new MockNewsProvider(), // or your real news provider
});
```

No other code changes required.

## Available Scripts

| Script | Description |
|---|---|
| `npm run build` | Compile TypeScript |
| `npm run clean` | Remove compiled output |
| `npm run start:worker` | Start the Temporal worker |
| `npm run start:client` | Execute the workflow with sample data |

## Temporal Web UI

After starting the dev server, open `http://localhost:8233` to:
- View workflow executions
- Inspect event history (see parallel activity scheduling)
- Check activity inputs/outputs
- Debug failed workflows
