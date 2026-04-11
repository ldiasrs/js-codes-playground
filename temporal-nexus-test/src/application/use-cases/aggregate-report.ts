// Use case: Aggregate all stock analyses into a final portfolio report

import { StockAnalysis } from '../../domain/types/financial';
import {
  PortfolioReport,
  PortfolioSummary,
  StockReport,
} from '../../domain/types/report';
import { StockData, StockNews } from '../../domain/types/stock';

export function aggregateReportUseCase(
  analyses: StockAnalysis[],
  stockDataMap: Record<string, StockData>,
  newsMap: Record<string, StockNews[]>,
  operationCost: number,
  referenceDate: string
): PortfolioReport {
  const totalInvested = analyses.reduce((sum, a) => sum + a.totalInvested, 0);
  const totalCurrentValue = analyses.reduce((sum, a) => sum + a.currentValue, 0);
  const totalProfitLoss = totalCurrentValue - totalInvested;
  const totalProfitLossPercent =
    totalInvested === 0 ? 0 : (totalProfitLoss / totalInvested) * 100;
  const netProfitLoss = totalProfitLoss - operationCost;
  const netProfitLossPercent =
    totalInvested === 0 ? 0 : (netProfitLoss / totalInvested) * 100;

  const summary: PortfolioSummary = {
    totalInvested: round(totalInvested),
    totalCurrentValue: round(totalCurrentValue),
    totalProfitLoss: round(totalProfitLoss),
    totalProfitLossPercent: round(totalProfitLossPercent),
    operationCost,
    netProfitLoss: round(netProfitLoss),
    netProfitLossPercent: round(netProfitLossPercent),
    referenceDate,
    numberOfStocks: analyses.length,
  };

  const stocks: StockReport[] = analyses.map((analysis) => ({
    analysis,
    financials: stockDataMap[analysis.ticker]?.financials ?? {
      ticker: analysis.ticker,
      peRatio: 0,
      dividendYield: 0,
      earningsPerShare: 0,
      priceToBook: 0,
    },
    news: newsMap[analysis.ticker] ?? [],
  }));

  return {
    summary,
    stocks,
    generatedAt: new Date().toISOString(),
  };
}

function round(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
