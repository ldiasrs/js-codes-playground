import { InterHttpClient } from "../inter-http-client";
import { SnapshotClock } from "../snapshot-clock";
import type { SnapshotArtifact, SnapshotSource } from "../snapshot-source";

const PATH = "/ib-pfj/investimentos/v1/home";

export class InvestmentHomeSource implements SnapshotSource {
  readonly name = "resumo";
  constructor(
    private readonly clock: SnapshotClock,
    private readonly client: InterHttpClient
  ) {}

  async fetch(): Promise<SnapshotArtifact> {
    const body = await this.client.getJson(PATH, {
      accept: "application/json, text/plain, */*",
      extraHeaders: {
        "x-inter-origem": "IBPF",
        "x-inter-ou": "IBPF",
        "x-inter-user-account-sub-type": "PF",
      },
    });

    return {
      fileName: `${this.clock.isoDate()}-resumo.json`,
      kind: "json",
      body,
    };
  }
}
