// Domain types for financial calculations

export interface ProfitLoss {
  absoluteProfitLoss: number; // in BRL
  percentageProfitLoss: number; // as percentage (e.g. 15.5 means 15.5%)
}

export interface ReturnMetrics {
  holdingMonths: number;
  monthlyReturnPercent: number;
  annualizedReturnPercent: number;
}

export interface StockAnalysis {
  ticker: string;
  units: number;
  purchasePrice: number;
  purchaseDate: string;
  currentPrice: number;
  totalInvested: number; // purchasePrice * units
  currentValue: number; // currentPrice * units
  profitLoss: ProfitLoss;
  returnMetrics: ReturnMetrics;
}
