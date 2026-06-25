import {
  AnalyzeStocksUseCase,
} from "../../application/port/AnalyzeStocksUseCase";

/**
 * Inbound (driving) adapter: parses CLI args and invokes the use case.
 * Any extra args are treated as explicit tickers.
 */
export class StockAnalysisCli {
  constructor(private readonly useCase: AnalyzeStocksUseCase) {}

  async run(argv: string[]): Promise<void> {
    const tickers = argv.filter((a) => !a.startsWith("-"));
    const result = await this.useCase.execute({ tickers });
    if (result.failed) {
      console.log(`(${result.failed}/${result.total} ticker(s) failed)`);
    }
  }
}
