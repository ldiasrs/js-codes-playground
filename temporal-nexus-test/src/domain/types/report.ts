// Domain types for the final report

import { StockAnalysis } from './financial';
import { StockNews, StockFinancials } from './stock';

export interface StockReport {
  analysis: StockAnalysis;
  financials: StockFinancials;
  news: StockNews[];
}

export interface PortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  operationCost: number;
  netProfitLoss: number; // totalProfitLoss - operationCost
  netProfitLossPercent: number;
  referenceDate: string;
  numberOfStocks: number;
}

export interface PortfolioReport {
  summary: PortfolioSummary;
  stocks: StockReport[];
  generatedAt: string; // ISO datetime
}
