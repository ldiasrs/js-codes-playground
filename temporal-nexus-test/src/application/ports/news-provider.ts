// Application port: News provider interface
// Infrastructure implementations must satisfy this contract

import { StockNews } from '../../domain/types/stock';

export interface NewsProvider {
  fetchNews(tickers: string[]): Promise<StockNews[]>;
}
