import { Snapshot } from "../../domain/model/Snapshot";

/** Input port: one provider's snapshot, already mapped to canonical tables. */
export interface SnapshotSource {
  read(): Snapshot;
}
