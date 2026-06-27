/**
 * Composition root — the only place that knows about concrete adapters.
 * Wires the hexagon together and runs the CLI.
 *
 * Run:
 *   npx ts-node --project tsconfig.node.json src/stocks/main.ts            # watchlist
 *   npx ts-node --project tsconfig.node.json src/stocks/main.ts AAPL VALE3 # specific tickers
 *   STOCKS_SOURCE_US=claude-cli npx ts-node --project tsconfig.node.json src/stocks/main.ts
 *
 * Source is resolved per market (see StockAnalysisConfig.sourceForMarket).
 */
import * as path from "path";

import { AnalyzeStocksService } from "./application/AnalyzeStocksService";
import { AnalyzerFactory } from "./adapter/analyzer/AnalyzerFactory";
import { CachingStockAnalyzer } from "./adapter/analyzer/CachingStockAnalyzer";
import { MarketRoutingStockAnalyzer } from "./adapter/analyzer/MarketRoutingStockAnalyzer";
import { FileDailyAnalysisCache } from "./adapter/cache/FileDailyAnalysisCache";
import { StockAnalysisCli } from "./adapter/cli/StockAnalysisCli";
import { StockAnalysisConfig } from "./adapter/config/StockAnalysisConfig";
import { ConsoleLogger } from "./adapter/logging/ConsoleLogger";
import { FilePromptProvider } from "./adapter/persistence/FilePromptProvider";
import { FileStockListProvider } from "./adapter/persistence/FileStockListProvider";
import { HtmlReportWriter } from "./adapter/report/HtmlReportWriter";
import { SystemClock } from "./adapter/time/SystemClock";
import { StockRanker } from "./domain/service/StockRanker";

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const CONFIG_FILE = path.join(PROJECT_ROOT, "config", "global-config.prod.json");
const PROMPT_FILE = path.join(__dirname, "stock-analysis-prompt.md");
const STOCKS_LIST_FILE = path.join(PROJECT_ROOT, "data", "stocks", "stocks-list.json");
const REPORTS_DIR = path.join(PROJECT_ROOT, "data", "stocks", "reports");
const CACHE_DIR = path.join(PROJECT_ROOT, "data", "stocks", "cache");

async function main(): Promise<void> {
  const config = new StockAnalysisConfig(CONFIG_FILE);
  const basePrompt = await new FilePromptProvider(PROMPT_FILE).basePrompt();
  const factory = new AnalyzerFactory(config, basePrompt);

  // Daily cache shared across markets — a same-day hit skips the source entirely.
  const clock = new SystemClock();
  const cache = new FileDailyAnalysisCache(CACHE_DIR, clock);
  const fetchEnabled = config.fetchEnabled();
  const ranker = new StockRanker(config.pillarWeights(), config.scoredFields());

  const br = factory.create(config.sourceForMarket("BR"), "BR");
  const us = factory.create(config.sourceForMarket("US"), "US");
  const analyzer = new MarketRoutingStockAnalyzer({
    BR: new CachingStockAnalyzer(br.analyzer, cache, fetchEnabled),
    US: new CachingStockAnalyzer(us.analyzer, cache, fetchEnabled),
  });

  const service = new AnalyzeStocksService({
    stockListProvider: new FileStockListProvider(STOCKS_LIST_FILE),
    analyzer,
    reportWriter: new HtmlReportWriter(REPORTS_DIR, ranker),
    clock,
    logger: new ConsoleLogger(),
    source: `BR=${br.label}, US=${us.label}`,
    concurrency: config.concurrency,
    cacheDate: cache.date,
    fetchEnabled,
  });

  const cli = new StockAnalysisCli(service);
  await cli.run(process.argv.slice(2));

  const missLabel = fetchEnabled ? `${cache.misses} fetched` : `${cache.misses} not cached`;
  const mode = fetchEnabled ? "fetch on" : "cache-only";
  console.log(`Cache (${mode}, ${cache.date}): ${cache.hits} hit(s), ${missLabel} → ${cache.file}`);
}

main().catch((err) => {
  console.error("Fatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
