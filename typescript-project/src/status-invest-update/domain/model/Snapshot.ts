import { PositionTable } from "./PositionTable";

/** A whole portfolio as one provider saw it at one moment. */
export interface Snapshot {
  readonly provider: string;
  /** When the provider captured it — the "as of" date the returns measure to. */
  readonly takenAt: Date;
  readonly tables: readonly PositionTable[];
}
