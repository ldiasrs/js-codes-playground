/**
 * Composition root — the only place that knows about concrete adapters.
 * Wires the hexagon together and runs the CLI.
 *
 * Run:
 *   npx ts-node --project tsconfig.node.json src/stocks/main.ts            # watchlist
 *   npx ts-node --project tsconfig.node.json src/stocks/main.ts AAPL VALE3 # specific tickers
 *   STOCKS_PROVIDER=gemini npx ts-node --project tsconfig.node.json src/stocks/main.ts
 */
import * as path from "path";

import { AnalyzeStocksService } from "./application/AnalyzeStocksService";
import { StockAnalysisCli } from "./adapter/cli/StockAnalysisCli";
import { StockAnalysisConfig } from "./adapter/config/StockAnalysisConfig";
import { createLlmGateway } from "./adapter/llm/LlmGatewayFactory";
import { ConsoleLogger } from "./adapter/logging/ConsoleLogger";
import { FilePromptProvider } from "./adapter/persistence/FilePromptProvider";
import { FileStockListProvider } from "./adapter/persistence/FileStockListProvider";
import { HtmlReportWriter } from "./adapter/report/HtmlReportWriter";
import { SystemClock } from "./adapter/time/SystemClock";

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const CONFIG_FILE = path.join(PROJECT_ROOT, "config", "global-config.prod.json");
const PROMPT_FILE = path.join(__dirname, "stock-analysis-prompt.md");
const STOCKS_LIST_FILE = path.join(PROJECT_ROOT, "data", "stocks", "stocks-list.json");
const REPORTS_DIR = path.join(PROJECT_ROOT, "data", "stocks", "reports");

async function main(): Promise<void> {
  const config = new StockAnalysisConfig(CONFIG_FILE).resolve();

  const llmGateway = createLlmGateway(config.spec);

  const service = new AnalyzeStocksService({
    stockListProvider: new FileStockListProvider(STOCKS_LIST_FILE),
    promptProvider: new FilePromptProvider(PROMPT_FILE),
    llmGateway,
    reportWriter: new HtmlReportWriter(REPORTS_DIR),
    clock: new SystemClock(),
    logger: new ConsoleLogger(),
    model: config.displayModel,
    concurrency: config.concurrency,
  });

  const cli = new StockAnalysisCli(service);
  await cli.run(process.argv.slice(2));
}

main().catch((err) => {
  console.error("Fatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
