/** A single buy/sell operation from the Status Invest transactions export. */
export interface Transaction {
  readonly referenceDate: string;
  readonly brokerId: number;
  readonly broker: string;
  readonly code: string;
  readonly name: string;
  readonly categoryId: string;
  readonly operationType: string;
  readonly quantity: number;
  readonly lineStatus: string;
  readonly unitValue: number;
  readonly totalValue: number;
}
