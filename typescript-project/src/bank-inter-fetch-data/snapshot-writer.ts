import { mkdir, writeFile } from "fs/promises";
import * as path from "path";

export class SnapshotWriter {
  constructor(private readonly snapshotDir: string) {}

  async prepare(): Promise<void> {
    await mkdir(this.snapshotDir, { recursive: true });
  }

  async writeJson(fileName: string, payload: unknown): Promise<string> {
    const filePath = path.join(this.snapshotDir, fileName);
    await writeFile(filePath, `${JSON.stringify(payload, null, 4)}\n`, "utf8");
    return filePath;
  }

  async writeBytes(fileName: string, payload: Buffer): Promise<string> {
    const filePath = path.join(this.snapshotDir, fileName);
    await writeFile(filePath, payload);
    return filePath;
  }
}
