import type { InvestmentProduct } from "../investment-products";
import { InterHttpClient } from "../inter-http-client";
import { SnapshotClock } from "../snapshot-clock";
import type { SnapshotArtifact, SnapshotSource } from "../snapshot-source";

export class InvestmentPositionSource implements SnapshotSource {
  readonly name: string;

  constructor(
    private readonly clock: SnapshotClock,
    private readonly client: InterHttpClient,
    private readonly product: InvestmentProduct
  ) {
    this.name = product.id;
  }

  async fetch(): Promise<SnapshotArtifact> {
    return {
      fileName: `${this.clock.isoDate()}-${this.product.fileSuffix}.json`,
      kind: "json",
      body: await this.client.getJson(this.urlPath()),
    };
  }

  private urlPath(): string {
    if (!this.product.includeDateQuery) {
      return this.product.path;
    }
    return `${this.product.path}?date=${this.clock.queryDate()}`;
  }
}
