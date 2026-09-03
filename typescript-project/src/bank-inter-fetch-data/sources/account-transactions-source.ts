import type { BankInterEnv } from "../env";
import { InterHttpClient } from "../inter-http-client";
import { SnapshotClock } from "../snapshot-clock";
import type { SnapshotArtifact, SnapshotSource } from "../snapshot-source";

const PATH = "/ib-pfj/cc/extrato/bff/v2/transactions";
const LOOKBACK_DAYS = 30;
const MAX_PAGES = 50;

export class AccountTransactionsSource implements SnapshotSource {
  readonly name = "conta";
  constructor(
    private readonly clock: SnapshotClock,
    private readonly client: InterHttpClient,
    private readonly env: BankInterEnv
  ) {}

  async fetch(): Promise<SnapshotArtifact> {
    const startDate = this.clock.daysAgoIso(LOOKBACK_DAYS);
    const endDate = this.clock.isoDate();
    const pages: unknown[] = [];

    for (let page = 0; page < MAX_PAGES; page += 1) {
      const payload = await this.client.getJson(
        `${PATH}?page=${page}&startDate=${startDate}&endDate=${endDate}`,
        {
          accept: "application/json, text/plain, */*",
          extraHeaders: {
            "x-inter-app-version": "12.0",
            "x-inter-conta-corrente": this.env.contaCorrente,
            "x-inter-organization": "IBPF",
            "x-inter-origin": "PF",
          },
        }
      );
      pages.push(payload);
      if (nextPageIndex(payload, page) === null) {
        break;
      }
    }

    return {
      fileName: `${this.clock.isoDate()}-conta.json`,
      kind: "json",
      body: {
        startDate,
        endDate,
        pages,
      },
    };
  }
}

function nextPageIndex(payload: unknown, current: number): number | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const root = payload as Record<string, unknown>;
  const nested = root.page && typeof root.page === "object"
    ? (root.page as Record<string, unknown>)
    : undefined;

  const totalPages = Number(nested?.totalPages ?? root.totalPages);
  if (Number.isFinite(totalPages) && current + 1 < totalPages) {
    return current + 1;
  }

  if (root.hasNext === true || nested?.hasNext === true || root.last === false) {
    return current + 1;
  }

  return null;
}
