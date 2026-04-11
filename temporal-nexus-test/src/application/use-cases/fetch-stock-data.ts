// Use case: Fetch stock data for a list of tickers

import { StockData } from '../../domain/types/stock';
import { StockDataProvider } from '../ports/stock-data-provider';

export async function fetchStockDataUseCase(
  provider: StockDataProvider,
  tickers: string[],
  referenceDate: string
): Promise<StockData[]> {
  return provider.fetchStockData(tickers, referenceDate);
}
