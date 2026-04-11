// Use case: Calculate financials for each stock in the portfolio

import { StockAnalysis } from '../../domain/types/financial';
import { StockInput } from '../../domain/types/portfolio';
import { StockData } from '../../domain/types/stock';
import { buildStockAnalysis } from '../../domain/services/financial-calculator';

export function calculateFinancialsUseCase(
  stockInputs: StockInput[],
  stockDataMap: Map<string, StockData>,
  referenceDate: string
): StockAnalysis[] {
  return stockInputs.map((input) => {
    const data = stockDataMap.get(input.ticker);
    if (!data) {
      throw new Error(`No stock data found for ticker: ${input.ticker}`);
    }
    return buildStockAnalysis(input, data.quote, referenceDate);
  });
}
