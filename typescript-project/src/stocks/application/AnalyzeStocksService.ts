import { MarketDetector } from "../domain/service/MarketDetector";
import { Stock } from "../domain/model/Stock";
import { AnalysisResult, failedAnalysis } from "../domain/model/StockAnalysis";
import {
  AnalyzeStocksCommand,
  AnalyzeStocksResult,
  AnalyzeStocksUseCase,
} from "./port/AnalyzeStocksUseCase";
import { Clock } from "./port/Clock";
import { Logger } from "./port/Logger";
import { ReportWriter } from "./port/ReportWriter";
import { SheetExporter } from "./port/SheetExporter";
import { StockAnalyzer } from "./port/StockAnalyzer";
import { StockListProvider } from "./port/StockListProvider";
import { mapWithConcurrency } from "./support/concurrency";

export interface AnalyzeStocksDeps {
  readonly stockListProvider: StockListProvider;
  readonly analyzer: StockAnalyzer;
  readonly reportWriter: ReportWriter;
  /** Optional: also export to Google Sheets when configured. */
  readonly sheetExporter?: SheetExporter;
  readonly clock: Clock;
  readonly logger: Logger;
  /** Human-readable source label for logs/report, e.g. "BR=statusinvest, US=claude-cli". */
  readonly source: string;
  readonly concurrency: number;
  /** Cache date (YYYY-MM-DD) shown in the report. */
  readonly cacheDate: string;
  /** Whether data fetching is enabled (false = cache-only). */
  readonly fetchEnabled: boolean;
}

/** Application service implementing the analyze-stocks use case. */
export class AnalyzeStocksService implements AnalyzeStocksUseCase {
  private readonly marketDetector = new MarketDetector();

  constructor(private readonly deps: AnalyzeStocksDeps) {}

  async execute(command: AnalyzeStocksCommand): Promise<AnalyzeStocksResult> {
    const { source, logger, concurrency } = this.deps;

    const stocks = await this.resolveStocks(command);
    logger.info(`Analyzing ${stocks.length} tickers via ${source} (concurrency ${concurrency})...`);

    const results = await mapWithConcurrency(stocks, concurrency, (stock) => this.analyzeOne(stock));

    const written = await this.deps.reportWriter.write(results, {
      source,
      generatedAt: this.deps.clock.now(),
      cacheDate: this.deps.cacheDate,
      fetchEnabled: this.deps.fetchEnabled,
    });

    const failed = results.filter((r) => r.kind === "failed").length;
    logger.info(`Report written: ${written.reportPath}`);
    if (failed) logger.warn(`${failed} ticker(s) failed — see report`);

    if (this.deps.sheetExporter) {
      try {
        const url = await this.deps.sheetExporter.export(results, {
          source,
          generatedAt: this.deps.clock.now(),
          cacheDate: this.deps.cacheDate,
          fetchEnabled: this.deps.fetchEnabled,
        });
        logger.info(`Google Sheet: ${url}`);
      } catch (err) {
        logger.warn(`Sheet export failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return { ...written, total: results.length, failed };
  }

  private async resolveStocks(command: AnalyzeStocksCommand): Promise<Stock[]> {
    const tickers = command.tickers ?? [];
    if (tickers.length) return tickers.map((t) => this.marketDetector.toStock(t));
    return this.deps.stockListProvider.load();
  }

  private async analyzeOne(stock: Stock): Promise<AnalysisResult> {
    try {
      const analysis = await this.deps.analyzer.analyze(stock);
      this.deps.logger.info(`  ✓ ${stock.ticker}`);
      return analysis;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.deps.logger.warn(`  ✗ ${stock.ticker}: ${message}`);
      return failedAnalysis(stock.ticker, stock.market, message);
    }
  }
}
