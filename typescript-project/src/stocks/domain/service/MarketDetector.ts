import { Market } from "../model/Market";
import { Stock } from "../model/Stock";

/**
 * Resolves a ticker's market from its shape:
 * B3 (Brazil) tickers end in a digit (PETR4, VALE3, GOLD11); US tickers are
 * letters only (AAPL, JNJ).
 */
export class MarketDetector {
  detect(ticker: string): Market {
    return /\d$/.test(ticker.trim().toUpperCase()) ? "BR" : "US";
  }

  toStock(ticker: string): Stock {
    const normalized = ticker.trim().toUpperCase();
    return { ticker: normalized, market: this.detect(normalized) };
  }
}
