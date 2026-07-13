import { Command } from "commander";
import { UpdateStatusInvestUseCase } from "./application/UpdateStatusInvestUseCase";
import { loadGoogleSheetConfig } from "./adapter/config/StatusInvestConfig";
import { JsonTransactionFileSource } from "./adapter/file/JsonTransactionFileSource";
import { JsonCdbFileSource } from "./adapter/file/JsonCdbFileSource";
import { GoogleSheetExporter } from "./adapter/sheet/GoogleSheetExporter";
import { TransactionGrouper } from "./domain/service/TransactionGrouper";
import { TransactionRowMapper } from "./domain/service/TransactionRowMapper";
import { CdbRowMapper } from "./domain/service/CdbRowMapper";

interface CliOptions {
  file: string;
  cdb?: string;
}

async function main(): Promise<void> {
  const program = new Command()
    .name("status-invest-update")
    .description(
      "Exports Status Invest transactions to the configured Google Spreadsheet, one color-themed tab per category",
    )
    .requiredOption("-f, --file <path>", "transactions JSON file (grouped by categoryId)")
    .option("-c, --cdb <path>", "optional CDB export file (creates an extra CDB tab)")
    .parse(process.argv);

  const options = program.opts<CliOptions>();

  const useCase = new UpdateStatusInvestUseCase(
    new JsonTransactionFileSource(options.file),
    new GoogleSheetExporter(loadGoogleSheetConfig()),
    new TransactionGrouper(),
    new TransactionRowMapper(),
    new CdbRowMapper(),
    options.cdb ? new JsonCdbFileSource(options.cdb) : undefined,
  );

  const results = await useCase.execute();
  for (const result of results) {
    console.log(`${result.group}: ${result.rowCount} rows -> ${result.url}`);
  }
  console.log(`Done. Created ${results.length} sheet(s).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
