import { InterHttpClient } from "../inter-http-client";
import { SnapshotClock } from "../snapshot-clock";
import type { SnapshotArtifact, SnapshotSource } from "../snapshot-source";

const PATH = "/ib-pfj/investimentos/v1/rentabilidade/pdf";

export class RentabilidadePdfSource implements SnapshotSource {
  readonly name = "rentabilidade-pdf";
  constructor(
    private readonly clock: SnapshotClock,
    private readonly client: InterHttpClient
  ) {}

  async fetch(): Promise<SnapshotArtifact> {
    const body = await this.client.getBytes(PATH, {
      accept: "application/pdf",
      extraHeaders: {
        "x-inter-origem": "IBPF",
        "x-inter-ou": "IBPF",
        "x-inter-user-account-sub-type": "",
      },
    });

    return {
      fileName: `${this.clock.isoDate()}-rentabilidade.pdf`,
      kind: "bytes",
      body,
    };
  }
}
