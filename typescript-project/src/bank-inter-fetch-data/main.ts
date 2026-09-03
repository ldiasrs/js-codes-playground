import dotenv from "dotenv";
import * as path from "path";

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
dotenv.config({ path: path.join(PROJECT_ROOT, ".env") });

import { readBankInterEnv } from "./env";
import { FetchBankSnapshots } from "./fetch-bank-snapshots";
import { INVESTMENT_PRODUCTS } from "./investment-products";
import { InterHttpClient } from "./inter-http-client";
import { SnapshotClock } from "./snapshot-clock";
import { SnapshotWriter } from "./snapshot-writer";
import { AccountTransactionsSource } from "./sources/account-transactions-source";
import { CreditCardInvoiceSource } from "./sources/credit-card-invoice-source";
import { InvestmentHomeSource } from "./sources/investment-home-source";
import { InvestmentPositionSource } from "./sources/investment-position-source";
import { RentabilidadePdfSource } from "./sources/rentabilidade-pdf-source";

const HISTORY_ROOT = path.join(
  PROJECT_ROOT,
  "data",
  "investimentos",
  "historico-investimentos"
);

async function main(): Promise<void> {
  const env = readBankInterEnv();
  const clock = new SnapshotClock();
  const client = new InterHttpClient(env.token);
  const snapshotDir = path.join(HISTORY_ROOT, clock.folderName());

  const sources = [
    ...INVESTMENT_PRODUCTS.map(
      (product) => new InvestmentPositionSource(clock, client, product)
    ),
    new InvestmentHomeSource(clock, client),
    new RentabilidadePdfSource(clock, client),
    new CreditCardInvoiceSource(clock, client, env),
    new AccountTransactionsSource(clock, client, env),
  ];

  const { written, failures } = await new FetchBankSnapshots(
    new SnapshotWriter(snapshotDir),
    sources
  ).run();

  console.log(`Saved ${written.length} snapshot(s) under ${snapshotDir}`);
  for (const file of written) {
    console.log(`  ${file}`);
  }

  if (failures.length > 0) {
    console.error(`Failed ${failures.length} snapshot(s):`);
    for (const failure of failures) {
      console.error(`  ${failure.source}: ${failure.message}`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
