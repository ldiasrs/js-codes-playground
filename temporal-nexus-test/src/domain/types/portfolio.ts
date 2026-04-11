// Domain types for portfolio input

export interface StockInput {
  ticker: string;
  units: number;
  purchasePrice: number;
  purchaseDate: string; // ISO date (YYYY-MM-DD)
}

export interface PortfolioInput {
  stocks: StockInput[];
  referenceDate: string; // ISO date (YYYY-MM-DD), defaults to current date
  operationCost: number; // total operation cost in BRL
}
