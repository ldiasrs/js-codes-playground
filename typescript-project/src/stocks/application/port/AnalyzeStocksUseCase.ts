/** Driving port: the entry point any inbound adapter (CLI, HTTP, cron) calls. */
export interface AnalyzeStocksCommand {
  /** Explicit tickers; when empty the configured watchlist is used. */
  readonly tickers?: string[];
}

export interface AnalyzeStocksResult {
  readonly reportPath: string;
  readonly dataPath: string;
  readonly total: number;
  readonly failed: number;
}

export interface AnalyzeStocksUseCase {
  execute(command: AnalyzeStocksCommand): Promise<AnalyzeStocksResult>;
}
