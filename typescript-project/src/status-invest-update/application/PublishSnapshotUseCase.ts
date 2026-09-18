import { PublishedSheet } from "../domain/model/SheetDefinition";
import { InvestmentSheetFactory } from "../domain/service/InvestmentSheetFactory";
import { SummarySheetFactory, SummarySource } from "../domain/service/SummarySheetFactory";
import { SheetPublisher } from "./port/SheetPublisher";
import { SnapshotSource } from "./port/SnapshotSource";

/**
 * The one mode: read a snapshot, publish a tab per asset class, then a summary
 * tab whose formulas point at the tabs just published.
 */
export class PublishSnapshotUseCase {
  constructor(
    private readonly snapshotSource: SnapshotSource,
    private readonly sheetPublisher: SheetPublisher,
    private readonly investmentSheets: InvestmentSheetFactory,
    private readonly summarySheet: SummarySheetFactory,
  ) {}

  async execute(): Promise<PublishedSheet[]> {
    const snapshot = this.snapshotSource.read();
    const definitions = snapshot.tables.map((table) => this.investmentSheets.build(table));

    const published: PublishedSheet[] = [];
    for (const definition of definitions) {
      published.push(await this.sheetPublisher.publish(definition));
    }

    const summarySources: SummarySource[] = snapshot.tables.map((table, index) => ({
      assetClass: table.assetClass,
      title: definitions[index].title,
      columns: definitions[index].columns,
    }));
    published.push(await this.sheetPublisher.publish(this.summarySheet.build(summarySources)));

    return published;
  }
}
