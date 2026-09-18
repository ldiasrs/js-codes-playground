import { AssetClassContract, basisFor } from "../model/AssetClassContract";
import { Position } from "../model/Position";
import { ReturnBasis } from "../model/ReturnBasis";

const DAYS_IN_YEAR = 365;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Evaluates the same return the headline formula shows, as a number.
 *
 * This exists only to decide row order: what the sheet displays always comes
 * from the formula, never from here. Both read the one `ReturnBasis` on the
 * asset class contract, so the ordering cannot disagree with the column it
 * claims to order by.
 */
export class PositionReturn {
  constructor(private readonly takenAt: Date) {}

  /** `null` where the formula would read blank — no date, or nothing invested. */
  of(contract: AssetClassContract, position: Position): number | null {
    const basis = basisFor(contract, position);
    const invested = this.investedAmount(basis, position);
    const current = numberAt(position, basis.currentColumn);
    if (invested === null || current === null || invested === 0) return null;

    const growth = current / invested;
    if (!basis.startDateColumn) return growth - 1;

    const daysHeld = this.daysHeld(position, basis.startDateColumn);
    if (daysHeld === null || daysHeld <= 0) return null;
    return growth ** (DAYS_IN_YEAR / daysHeld) - 1;
  }

  private investedAmount(basis: ReturnBasis, position: Position): number | null {
    const invested = numberAt(position, basis.investedColumn);
    if (invested === null || !basis.withdrawnColumn) return invested;
    return invested - (numberAt(position, basis.withdrawnColumn) ?? 0);
  }

  private daysHeld(position: Position, startDateColumn: string): number | null {
    const startDate = position[startDateColumn];
    if (!(startDate instanceof Date)) return null;
    return (this.takenAt.getTime() - startDate.getTime()) / MILLISECONDS_PER_DAY;
  }
}

function numberAt(position: Position, columnId: string): number | null {
  const value = position[columnId];
  return typeof value === "number" ? value : null;
}
