import { Command } from "commander";
import { UpdateStatusInvestUseCase } from "./application/UpdateStatusInvestUseCase";
import { SnapshotUpdateUseCase } from "./application/SnapshotUpdateUseCase";
import { loadGoogleSheetConfig, loadSnapshotUpdateConfig } from "./adapter/config/StatusInvestConfig";
import { JsonTransactionFileSource } from "./adapter/file/JsonTransactionFileSource";
import { JsonCdbFileSource } from "./adapter/file/JsonCdbFileSource";
import { GoogleSheetExporter } from "./adapter/sheet/GoogleSheetExporter";
import { TransactionGrouper } from "./domain/service/TransactionGrouper";
import { TransactionRowMapper } from "./domain/service/TransactionRowMapper";
import { CdbRowMapper } from "./domain/service/CdbRowMapper";

interface CliOptions {
  file?: string;
  cdb?: string;
  snapshotUpdate?: boolean;
  snapshotFolder?: string;
}

async function main(): Promise<void> {
  const program = new Command()
    .name("status-invest-update")
    .description(
      "Exports Status Invest transactions or investment-history snapshots to the configured Google Spreadsheet",
    )
    .option("-f, --file <path>", "transactions JSON file (grouped by categoryId)")
    .option("-c, --cdb <path>", "optional CDB export file (creates an extra CDB tab)")
    .option("--snapshot-update", "export the configured investment-history snapshot")
    .option("--snapshot-folder <path>", "investment-history folder (implies --snapshot-update)")
    .parse(process.argv);

  const options = program.opts<CliOptions>();

  const snapshotConfig = loadSnapshotUpdateConfig();
  const useSnapshot = Boolean(options.snapshotUpdate || options.snapshotFolder || (!options.file && snapshotConfig?.enabled));
  if (useSnapshot) {
    if (options.file || options.cdb) {
      throw new Error("--snapshot-update cannot be combined with --file or --cdb");
    }
    const sourceFolder = options.snapshotFolder ?? snapshotConfig?.sourceFolder;
    if (!sourceFolder) {
      throw new Error("snapshot folder missing: set snapshot_update.source_folder or use --snapshot-folder");
    }
    const results = await new SnapshotUpdateUseCase(
      sourceFolder,
      new GoogleSheetExporter(loadGoogleSheetConfig()),
    ).execute();
    printResults(results);
    return;
  }

  if (!options.file) {
    throw new Error("--file is required unless snapshot_update is enabled in the configuration");
  }
  const results = await new UpdateStatusInvestUseCase(
    new JsonTransactionFileSource(options.file),
    new GoogleSheetExporter(loadGoogleSheetConfig()),
    new TransactionGrouper(),
    new TransactionRowMapper(),
    new CdbRowMapper(),
    options.cdb ? new JsonCdbFileSource(options.cdb) : undefined,
  ).execute();
  printResults(results);
}

function printResults(results: { group: string; rowCount: number; url: string }[]): void {
  for (const result of results) {
    console.log(`${result.group}: ${result.rowCount} rows -> ${result.url}`);
  }
  console.log(`Done. Created ${results.length} sheet(s).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
