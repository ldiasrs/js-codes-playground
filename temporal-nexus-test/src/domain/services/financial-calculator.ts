// Domain service: Pure financial calculation functions
// No external dependencies — all logic is deterministic and testable

import { ProfitLoss, ReturnMetrics, StockAnalysis } from '../types/financial';
import { StockInput } from '../types/portfolio';
import { StockQuote } from '../types/stock';
import { monthsBetween } from '../../shared/utils/date';

export function calculateProfitLoss(
  currentPrice: number,
  purchasePrice: number,
  units: number
): ProfitLoss {
  const currentValue = currentPrice * units;
  const investedValue = purchasePrice * units;
  const absoluteProfitLoss = currentValue - investedValue;
  const percentageProfitLoss =
    investedValue === 0 ? 0 : ((currentPrice - purchasePrice) / purchasePrice) * 100;

  return {
    absoluteProfitLoss: round(absoluteProfitLoss),
    percentageProfitLoss: round(percentageProfitLoss),
  };
}

export function calculateReturnMetrics(
  percentageProfitLoss: number,
  purchaseDate: string,
  referenceDate: string
): ReturnMetrics {
  const holdingMonths = Math.max(monthsBetween(purchaseDate, referenceDate), 1);

  // Simple monthly return = total % / months
  const monthlyReturnPercent = percentageProfitLoss / holdingMonths;

  // Annualized return using compound formula:
  // ((1 + totalReturn)^(12/months) - 1) * 100
  const totalReturnDecimal = percentageProfitLoss / 100;
  const annualizedReturnPercent =
    (Math.pow(1 + totalReturnDecimal, 12 / holdingMonths) - 1) * 100;

  return {
    holdingMonths,
    monthlyReturnPercent: round(monthlyReturnPercent),
    annualizedReturnPercent: round(annualizedReturnPercent),
  };
}

export function buildStockAnalysis(
  stockInput: StockInput,
  quote: StockQuote,
  referenceDate: string
): StockAnalysis {
  const { ticker, units, purchasePrice, purchaseDate } = stockInput;
  const currentPrice = quote.currentPrice;

  const profitLoss = calculateProfitLoss(currentPrice, purchasePrice, units);
  const returnMetrics = calculateReturnMetrics(
    profitLoss.percentageProfitLoss,
    purchaseDate,
    referenceDate
  );

  return {
    ticker,
    units,
    purchasePrice,
    purchaseDate,
    currentPrice,
    totalInvested: round(purchasePrice * units),
    currentValue: round(currentPrice * units),
    profitLoss,
    returnMetrics,
  };
}

function round(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
