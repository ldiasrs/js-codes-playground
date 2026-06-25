import { MarketDetector } from "../domain/service/MarketDetector";
import { PromptBuilder } from "../domain/service/PromptBuilder";
import { StockAnalysisParser } from "../domain/service/StockAnalysisParser";
import { Stock } from "../domain/model/Stock";
import { AnalysisResult, failedAnalysis } from "../domain/model/StockAnalysis";
import {
  AnalyzeStocksCommand,
  AnalyzeStocksResult,
  AnalyzeStocksUseCase,
} from "./port/AnalyzeStocksUseCase";
import { Clock } from "./port/Clock";
import { LlmGateway } from "./port/LlmGateway";
import { Logger } from "./port/Logger";
import { PromptProvider } from "./port/PromptProvider";
import { ReportWriter } from "./port/ReportWriter";
import { StockListProvider } from "./port/StockListProvider";
import { mapWithConcurrency } from "./support/concurrency";

export interface AnalyzeStocksDeps {
  readonly stockListProvider: StockListProvider;
  readonly promptProvider: PromptProvider;
  readonly llmGateway: LlmGateway;
  readonly reportWriter: ReportWriter;
  readonly clock: Clock;
  readonly logger: Logger;
  readonly model: string;
  readonly concurrency: number;
}

/** Application service implementing the analyze-stocks use case. */
export class AnalyzeStocksService implements AnalyzeStocksUseCase {
  private readonly marketDetector = new MarketDetector();
  private readonly parser = new StockAnalysisParser();

  constructor(private readonly deps: AnalyzeStocksDeps) {}

  async execute(command: AnalyzeStocksCommand): Promise<AnalyzeStocksResult> {
    const { llmGateway, logger, model, concurrency } = this.deps;

    const stocks = await this.resolveStocks(command);
    const promptBuilder = new PromptBuilder(await this.deps.promptProvider.basePrompt());

    logger.info(
      `Analyzing ${stocks.length} tickers with ${llmGateway.name}/${model} (concurrency ${concurrency})...`,
    );

    const results = await mapWithConcurrency(stocks, concurrency, (stock) =>
      this.analyzeOne(stock, promptBuilder),
    );

    const written = await this.deps.reportWriter.write(results, {
      provider: llmGateway.name,
      model,
      generatedAt: this.deps.clock.now(),
    });

    const failed = results.filter((r) => r.kind === "failed").length;
    logger.info(`Report written: ${written.reportPath}`);
    if (failed) logger.warn(`${failed} ticker(s) failed — see report`);

    return { ...written, total: results.length, failed };
  }

  private async resolveStocks(command: AnalyzeStocksCommand): Promise<Stock[]> {
    const tickers = command.tickers ?? [];
    if (tickers.length) return tickers.map((t) => this.marketDetector.toStock(t));
    return this.deps.stockListProvider.load();
  }

  private async analyzeOne(stock: Stock, promptBuilder: PromptBuilder): Promise<AnalysisResult> {
    try {
      const raw = await this.deps.llmGateway.complete(promptBuilder.build(stock));
      const analysis = this.parser.parse(raw, stock);
      this.deps.logger.info(`  ✓ ${stock.ticker}`);
      return analysis;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.deps.logger.warn(`  ✗ ${stock.ticker}: ${message}`);
      return failedAnalysis(stock.ticker, stock.market, message);
    }
  }
}
