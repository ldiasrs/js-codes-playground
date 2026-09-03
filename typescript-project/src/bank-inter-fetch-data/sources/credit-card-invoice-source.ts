import type { BankInterEnv } from "../env";
import { InterHttpClient } from "../inter-http-client";
import { SnapshotClock } from "../snapshot-clock";
import type { SnapshotArtifact, SnapshotSource } from "../snapshot-source";

const PATH = "/ib-pfj/meios-pagamentos/v2/invoices/OPEN/transactions";

export class CreditCardInvoiceSource implements SnapshotSource {
  readonly name = "cartao";
  constructor(
    private readonly clock: SnapshotClock,
    private readonly client: InterHttpClient,
    private readonly env: BankInterEnv
  ) {}

  async fetch(): Promise<SnapshotArtifact> {
    const closingDate = this.clock.invoiceClosingDate();
    const body = await this.client.getJson(PATH, {
      extraHeaders: {
        cardaccount: this.env.cardAccount,
        closingdate: closingDate,
        cpfcnpj: this.env.cpfCnpj,
        product: this.env.cardProduct,
        theme: "PF",
        type: "OPEN",
        "x-inter-conta-corrente": this.env.contaCorrente,
        "x-inter-organization": "IBPF",
        "x-inter-tema": "PF",
      },
    });

    return {
      fileName: `${this.clock.isoDate()}-cartao.json`,
      kind: "json",
      body,
    };
  }
}
