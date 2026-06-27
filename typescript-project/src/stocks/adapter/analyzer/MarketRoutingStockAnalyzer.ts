import { StockAnalyzer } from "../../application/port/StockAnalyzer";
import { Market } from "../../domain/model/Market";
import { Stock } from "../../domain/model/Stock";
import { StockAnalysis } from "../../domain/model/StockAnalysis";

/** Routes each ticker to the analyzer for its market (BR → brapi, US → FMP). */
export class MarketRoutingStockAnalyzer implements StockAnalyzer {
  readonly name = "finance-apis";

  constructor(private readonly byMarket: Record<Market, StockAnalyzer>) {}

  analyze(stock: Stock): Promise<StockAnalysis> {
    return this.byMarket[stock.market].analyze(stock);
  }
}
