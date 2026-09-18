import { SnapshotSource } from "../../../application/port/SnapshotSource";
import { ASSET_CLASSES } from "../../../domain/model/AssetClass";
import { Snapshot } from "../../../domain/model/Snapshot";
import { AcoesBrMapper } from "./AcoesBrMapper";
import { AssetTableMapper } from "./AssetTableMapper";
import { FundosMapper } from "./FundosMapper";
import { RendaFixaMapper } from "./RendaFixaMapper";
import { SnapshotFolder } from "./SnapshotFolder";

export const STATUS_INVEST = "status-invest";

const MAPPERS: readonly AssetTableMapper[] = [
  new AcoesBrMapper(),
  new FundosMapper(),
  new RendaFixaMapper(),
];

/** Reads a Status Invest history folder as a canonical snapshot. */
export class StatusInvestSnapshotSource implements SnapshotSource {
  private readonly mappers: readonly AssetTableMapper[];

  constructor(
    private readonly folder: SnapshotFolder,
    mappers: readonly AssetTableMapper[] = MAPPERS,
  ) {
    this.mappers = orderedByAssetClass(mappers);
  }

  read(): Snapshot {
    return {
      provider: STATUS_INVEST,
      takenAt: this.folder.takenAt(),
      tables: this.mappers.map((mapper) => mapper.map(this.folder.read(mapper.assetClass))),
    };
  }
}

/** Tab order follows the canonical asset-class order, not the mapper list. */
function orderedByAssetClass(mappers: readonly AssetTableMapper[]): AssetTableMapper[] {
  return ASSET_CLASSES.map((assetClass) => {
    const mapper = mappers.find((candidate) => candidate.assetClass === assetClass);
    if (!mapper) throw new Error(`no mapper provided for "${assetClass}"`);
    return mapper;
  });
}
