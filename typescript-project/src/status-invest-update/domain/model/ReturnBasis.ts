/**
 * The columns the profit formulas read.
 *
 * `startDateColumn` is what makes a return annualizable: without it only the
 * total return can be stated. `withdrawnColumn` is for products that are paid
 * out in parts — what was taken back out is not still invested.
 */
export interface ReturnBasis {
  readonly investedColumn: string;
  readonly currentColumn: string;
  readonly withdrawnColumn?: string;
  readonly startDateColumn?: string;
}
