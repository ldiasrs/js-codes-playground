import { SnapshotSource } from "./snapshot-source";
import { SnapshotWriter } from "./snapshot-writer";

export type SnapshotFailure = {
  source: string;
  message: string;
};

export type SnapshotRunResult = {
  written: string[];
  failures: SnapshotFailure[];
};

export class FetchBankSnapshots {
  constructor(
    private readonly writer: SnapshotWriter,
    private readonly sources: readonly SnapshotSource[]
  ) {}

  async run(): Promise<SnapshotRunResult> {
    await this.writer.prepare();
    const written: string[] = [];
    const failures: SnapshotFailure[] = [];

    for (const source of this.sources) {
      try {
        const artifact = await source.fetch();
        if (artifact.kind === "json") {
          written.push(await this.writer.writeJson(artifact.fileName, artifact.body));
        } else {
          written.push(await this.writer.writeBytes(artifact.fileName, artifact.body));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push({ source: source.name, message });
        console.error(`Skipped ${source.name}: ${message}`);
      }
    }

    return { written, failures };
  }
}
