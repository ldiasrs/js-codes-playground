// Domain types for stock data

export interface StockQuote {
  ticker: string;
  currentPrice: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  marketCap: number;
  currency: string;
  fetchedAt: string; // ISO date
}

export interface StockFinancials {
  ticker: string;
  peRatio: number;
  dividendYield: number;
  earningsPerShare: number;
  priceToBook: number;
}

export interface StockData {
  quote: StockQuote;
  financials: StockFinancials;
}

export interface StockNews {
  ticker: string;
  headline: string;
  source: string;
  publishedAt: string; // ISO date
  summary: string;
  url: string;
}
