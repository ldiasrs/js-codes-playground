// Use case: Fetch news for a list of tickers

import { StockNews } from '../../domain/types/stock';
import { NewsProvider } from '../ports/news-provider';

export async function fetchStockNewsUseCase(
  provider: NewsProvider,
  tickers: string[]
): Promise<StockNews[]> {
  return provider.fetchNews(tickers);
}
