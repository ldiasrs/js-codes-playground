import { Command } from "commander";
import { PublishSnapshotUseCase } from "./application/PublishSnapshotUseCase";
import { SheetPublisher } from "./application/port/SheetPublisher";
import { loadSnapshotConfig } from "./adapter/config/SnapshotConfig";
import { SnapshotFolder } from "./adapter/provider/status-invest/SnapshotFolder";
import { StatusInvestSnapshotSource } from "./adapter/provider/status-invest/StatusInvestSnapshotSource";
import { ConsoleSheetPublisher } from "./adapter/sheet/ConsoleSheetPublisher";
import { GoogleSheetPublisher } from "./adapter/sheet/GoogleSheetPublisher";
import { PublishedSheet } from "./domain/model/SheetDefinition";
import { FormulaDialect } from "./domain/service/FormulaDialect";
import { InvestmentSheetFactory } from "./domain/service/InvestmentSheetFactory";
import { PositionReturn } from "./domain/service/PositionReturn";
import { ReturnFormulas } from "./domain/service/ReturnFormulas";
import { SheetTitle } from "./domain/service/SheetTitle";
import { SummarySheetFactory } from "./domain/service/SummarySheetFactory";

interface CliOptions {
  folder?: string;
  dryRun?: boolean;
}

/** Composition root: reads the CLI, wires the adapters, runs the one use case. */
async function main(): Promise<void> {
  const program = new Command()
    .name("status-invest-update")
    .description("Publishes a Status Invest history snapshot as dated spreadsheet tabs")
    .option("-f, --folder <path>", "snapshot folder to publish")
    .option("--dry-run", "print the tabs instead of writing to the spreadsheet")
    .parse(process.argv);

  const options = program.opts<CliOptions>();
  const config = loadSnapshotConfig();
  const sourceFolder = options.folder ?? config.defaultSourceFolder;
  if (!sourceFolder) {
    throw new Error(
      'no snapshot folder: pass --folder or set "update_invest_spread_sheet.snapshot_update.source_folder"',
    );
  }

  const folder = new SnapshotFolder(sourceFolder);
  const title = new SheetTitle();
  const dialect = new FormulaDialect();
  const published = await new PublishSnapshotUseCase(
    new StatusInvestSnapshotSource(folder),
    publisherFor(options, config.credentials),
    new InvestmentSheetFactory(
      new ReturnFormulas(folder.takenAt(), dialect),
      new PositionReturn(folder.takenAt()),
      title,
    ),
    new SummarySheetFactory(title, dialect),
  ).execute();

  report(published);
}

function publisherFor(
  options: CliOptions,
  credentials: ReturnType<typeof loadSnapshotConfig>["credentials"],
): SheetPublisher {
  return options.dryRun ? new ConsoleSheetPublisher() : new GoogleSheetPublisher(credentials);
}

function report(published: readonly PublishedSheet[]): void {
  for (const sheet of published) {
    console.log(`${sheet.title}: ${sheet.rowCount} rows -> ${sheet.url}`);
  }
  console.log(`Done. Published ${published.length} tab(s).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
