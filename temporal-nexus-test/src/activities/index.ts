// Activities: Factory function using Temporal's dependency injection pattern
// Activities are thin wrappers that delegate to application use-cases

import { StockDataProvider } from '../application/ports/stock-data-provider';
import { NewsProvider } from '../application/ports/news-provider';
import { fetchStockDataUseCase } from '../application/use-cases/fetch-stock-data';
import { fetchStockNewsUseCase } from '../application/use-cases/fetch-stock-news';
import { calculateFinancialsUseCase } from '../application/use-cases/calculate-financials';
import { aggregateReportUseCase } from '../application/use-cases/aggregate-report';
import { StockData, StockNews } from '../domain/types/stock';
import { StockInput } from '../domain/types/portfolio';
import { StockAnalysis } from '../domain/types/financial';
import { PortfolioReport } from '../domain/types/report';

export interface ActivityDependencies {
  stockDataProvider: StockDataProvider;
  newsProvider: NewsProvider;
}

/**
 * Creates all activity functions with injected dependencies.
 * This follows Temporal's recommended pattern for dependency injection.
 */
export function createActivities(deps: ActivityDependencies) {
  return {
    /**
     * Fetch current financial data for a list of stock tickers.
     */
    async fetchFinancialData(
      tickers: string[],
      referenceDate: string
    ): Promise<StockData[]> {
      return fetchStockDataUseCase(deps.stockDataProvider, tickers, referenceDate);
    },

    /**
     * Fetch recent news for a list of stock tickers.
     */
    async fetchNews(tickers: string[]): Promise<StockNews[]> {
      return fetchStockNewsUseCase(deps.newsProvider, tickers);
    },

    /**
     * Calculate financial metrics (P/L, returns) for each stock.
     * Receives serializable objects (not Map) from the workflow.
     */
    async calculateFinancials(
      stockInputs: StockInput[],
      stockDataList: StockData[],
      referenceDate: string
    ): Promise<StockAnalysis[]> {
      const stockDataMap = new Map(
        stockDataList.map((d) => [d.quote.ticker, d])
      );
      return calculateFinancialsUseCase(stockInputs, stockDataMap, referenceDate);
    },

    /**
     * Aggregate all analyses into a final portfolio report.
     */
    async aggregateReport(
      analyses: StockAnalysis[],
      stockDataList: StockData[],
      newsList: StockNews[],
      operationCost: number,
      referenceDate: string
    ): Promise<PortfolioReport> {
      const stockDataMap: Record<string, StockData> = {};
      for (const d of stockDataList) {
        stockDataMap[d.quote.ticker] = d;
      }

      const newsMap: Record<string, StockNews[]> = {};
      for (const n of newsList) {
        if (!newsMap[n.ticker]) {
          newsMap[n.ticker] = [];
        }
        newsMap[n.ticker].push(n);
      }

      return aggregateReportUseCase(
        analyses,
        stockDataMap,
        newsMap,
        operationCost,
        referenceDate
      );
    },
  };
}

// Export the type so the workflow can import it for proxyActivities
export type Activities = ReturnType<typeof createActivities>;
