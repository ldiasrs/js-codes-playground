// Infrastructure: Mock stock data provider with realistic B3 stock data
// Replace this with a real API provider (e.g., brapi.dev, Alpha Vantage)
// by implementing the StockDataProvider interface

import { StockDataProvider } from '../../application/ports/stock-data-provider';
import { StockData, StockQuote, StockFinancials } from '../../domain/types/stock';

// Realistic B3 stock mock data
const MOCK_DATA: Record<string, { quote: Omit<StockQuote, 'fetchedAt'>; financials: StockFinancials }> = {
  PETR4: {
    quote: {
      ticker: 'PETR4',
      currentPrice: 38.72,
      previousClose: 38.15,
      dayHigh: 39.10,
      dayLow: 37.90,
      volume: 45_320_100,
      marketCap: 502_000_000_000,
      currency: 'BRL',
    },
    financials: {
      ticker: 'PETR4',
      peRatio: 4.8,
      dividendYield: 12.5,
      earningsPerShare: 8.07,
      priceToBook: 1.3,
    },
  },
  VALE3: {
    quote: {
      ticker: 'VALE3',
      currentPrice: 62.45,
      previousClose: 61.80,
      dayHigh: 63.10,
      dayLow: 61.20,
      volume: 32_150_800,
      marketCap: 280_000_000_000,
      currency: 'BRL',
    },
    financials: {
      ticker: 'VALE3',
      peRatio: 6.2,
      dividendYield: 8.9,
      earningsPerShare: 10.07,
      priceToBook: 1.7,
    },
  },
  ITUB4: {
    quote: {
      ticker: 'ITUB4',
      currentPrice: 34.20,
      previousClose: 33.95,
      dayHigh: 34.50,
      dayLow: 33.80,
      volume: 28_750_300,
      marketCap: 315_000_000_000,
      currency: 'BRL',
    },
    financials: {
      ticker: 'ITUB4',
      peRatio: 8.5,
      dividendYield: 5.2,
      earningsPerShare: 4.02,
      priceToBook: 1.9,
    },
  },
  BBDC4: {
    quote: {
      ticker: 'BBDC4',
      currentPrice: 15.30,
      previousClose: 15.10,
      dayHigh: 15.50,
      dayLow: 14.95,
      volume: 22_400_500,
      marketCap: 158_000_000_000,
      currency: 'BRL',
    },
    financials: {
      ticker: 'BBDC4',
      peRatio: 10.2,
      dividendYield: 7.1,
      earningsPerShare: 1.50,
      priceToBook: 1.1,
    },
  },
  WEGE3: {
    quote: {
      ticker: 'WEGE3',
      currentPrice: 42.80,
      previousClose: 42.30,
      dayHigh: 43.20,
      dayLow: 42.10,
      volume: 8_320_400,
      marketCap: 180_000_000_000,
      currency: 'BRL',
    },
    financials: {
      ticker: 'WEGE3',
      peRatio: 35.6,
      dividendYield: 1.4,
      earningsPerShare: 1.20,
      priceToBook: 10.5,
    },
  },
};

export class MockStockDataProvider implements StockDataProvider {
  async fetchStockData(tickers: string[], referenceDate: string): Promise<StockData[]> {
    // Simulate network latency
    await delay(100);

    return tickers.map((ticker) => {
      const mock = MOCK_DATA[ticker.toUpperCase()];
      if (!mock) {
        // For unknown tickers, generate reasonable defaults
        return {
          quote: {
            ticker,
            currentPrice: 20.0 + Math.random() * 30,
            previousClose: 19.5 + Math.random() * 30,
            dayHigh: 21.0 + Math.random() * 30,
            dayLow: 18.5 + Math.random() * 30,
            volume: Math.floor(Math.random() * 10_000_000),
            marketCap: Math.floor(Math.random() * 100_000_000_000),
            currency: 'BRL',
            fetchedAt: new Date().toISOString(),
          },
          financials: {
            ticker,
            peRatio: 10 + Math.random() * 20,
            dividendYield: Math.random() * 10,
            earningsPerShare: Math.random() * 5,
            priceToBook: 0.5 + Math.random() * 5,
          },
        };
      }

      return {
        quote: { ...mock.quote, fetchedAt: new Date().toISOString() },
        financials: { ...mock.financials },
      };
    });
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
