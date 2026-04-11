// Application port: Stock data provider interface
// Infrastructure implementations must satisfy this contract

import { StockData } from '../../domain/types/stock';

export interface StockDataProvider {
  fetchStockData(tickers: string[], referenceDate: string): Promise<StockData[]>;
}
