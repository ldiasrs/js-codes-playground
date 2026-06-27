import { AnalysisCache } from "../../application/port/AnalysisCache";
import { StockAnalyzer } from "../../application/port/StockAnalyzer";
import { Stock } from "../../domain/model/Stock";
import { StockAnalysis } from "../../domain/model/StockAnalysis";

/**
 * Decorator: serves a cached analysis when present. On a miss it either fetches via the
 * delegate (when `fetchEnabled`) and stores the result, or throws so the use case renders
 * a "not cached" card (cache-only mode). On a hit the delegate — AI / API / scrape — is
 * never called. Failures are not cached. Key = source name + market + ticker.
 */
export class CachingStockAnalyzer implements StockAnalyzer {
  constructor(
    private readonly delegate: StockAnalyzer,
    private readonly cache: AnalysisCache,
    private readonly fetchEnabled: boolean,
  ) {}

  get name(): string {
    return this.delegate.name;
  }

  async analyze(stock: Stock): Promise<StockAnalysis> {
    const key = `${this.delegate.name}:${stock.market}:${stock.ticker}`;
    const cached = this.cache.get(key);
    if (cached) return cached;

    if (!this.fetchEnabled) {
      throw new Error("not cached (run with STOCKS_FETCH=1 to fetch)");
    }

    const analysis = await this.delegate.analyze(stock);
    this.cache.put(key, analysis);
    return analysis;
  }
}
