import { ExportDefinition } from "../domain/model/ExportDefinition";
import { CdbRowMapper } from "../domain/service/CdbRowMapper";
import { TransactionGrouper } from "../domain/service/TransactionGrouper";
import { TransactionRowMapper } from "../domain/service/TransactionRowMapper";
import { CdbSource } from "./port/CdbSource";
import { ExportWriter } from "./port/ExportWriter";
import { TransactionSource } from "./port/TransactionSource";

export interface ExportResult {
  readonly group: string;
  readonly rowCount: number;
  readonly url: string;
}

const CDB_GROUP = "CDB";

export class UpdateStatusInvestUseCase {
  constructor(
    private readonly transactionSource: TransactionSource,
    private readonly exportWriter: ExportWriter,
    private readonly grouper: TransactionGrouper = new TransactionGrouper(),
    private readonly transactionMapper: TransactionRowMapper = new TransactionRowMapper(),
    private readonly cdbMapper: CdbRowMapper = new CdbRowMapper(),
    private readonly cdbSource?: CdbSource,
  ) {}

  async execute(): Promise<ExportResult[]> {
    const definitions = [
      ...this.buildTransactionDefinitions(),
      ...this.buildCdbDefinitions(),
    ];

    const results: ExportResult[] = [];
    for (const definition of definitions) {
      const url = await this.exportWriter.write(definition);
      results.push({ group: definition.group, rowCount: definition.rows.length, url });
    }
    return results;
  }

  private buildTransactionDefinitions(): ExportDefinition[] {
    const groups = this.grouper.group(this.transactionSource.load());
    return [...groups.entries()].map(([group, transactions]) => ({
      group,
      headers: this.transactionMapper.headers,
      rows: transactions.map((t) => this.transactionMapper.toRow(t)),
    }));
  }

  private buildCdbDefinitions(): ExportDefinition[] {
    if (!this.cdbSource) return [];
    const positions = [...this.cdbSource.load()].sort((a, b) =>
      a.referenceDate.localeCompare(b.referenceDate),
    );
    return [
      {
        group: CDB_GROUP,
        headers: this.cdbMapper.headers,
        rows: positions.map((p) => this.cdbMapper.toRow(p)),
      },
    ];
  }
}
