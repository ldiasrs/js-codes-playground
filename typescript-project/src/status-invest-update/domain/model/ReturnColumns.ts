import { Column } from "./Column";

export const MONTHLY_RETURN = "%-mes";
export const ANNUAL_RETURN = "%-ano";
export const TOTAL_RETURN = "%-total";

const MONTHLY: Column = { id: MONTHLY_RETURN, kind: "percent" };
const ANNUAL: Column = { id: ANNUAL_RETURN, kind: "percent" };
const TOTAL: Column = { id: TOTAL_RETURN, kind: "percent" };

/**
 * The profit columns a tab leads with. `%-ano` is only honest where a holding
 * period exists to compound over; everywhere else the headline is `%-total`,
 * which says what it is — the return since inception.
 */
export interface ReturnColumnSet {
  readonly headline: Column;
  /** A twelfth of the headline, placed before it. Only where it is meaningful. */
  readonly monthly?: Column;
}

export const ANNUALISED_WITH_MONTHLY: ReturnColumnSet = { monthly: MONTHLY, headline: ANNUAL };
export const TOTAL_ONLY: ReturnColumnSet = { headline: TOTAL };

export function columnsOf(set: ReturnColumnSet): Column[] {
  return set.monthly ? [set.monthly, set.headline] : [set.headline];
}
