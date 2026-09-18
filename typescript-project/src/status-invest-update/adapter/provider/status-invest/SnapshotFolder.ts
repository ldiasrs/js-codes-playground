import { readdirSync, readFileSync } from "fs";
import path from "path";
import { AssetClass } from "../../../domain/model/AssetClass";

const FOLDER_STAMP = /^(\d{4})-(\d{2})-(\d{2})-(\d{2})h(\d{2})m(\d{2})$/;
const FILE_STAMP = /^(\d{4})-(\d{2})-(\d{2})-/;

/**
 * One exported history folder, e.g. `2026-09-17-12h53m13`, holding one
 * `<date>-<asset-class>.json` file per asset class.
 */
export class SnapshotFolder {
  constructor(private readonly folder: string) {}

  /** When the wallet was captured — the date the returns are measured to. */
  takenAt(): Date {
    const stamp = FOLDER_STAMP.exec(path.basename(this.folder));
    if (!stamp) return this.takenAtFromFileNames();
    const [, year, month, day, hour, minute, second] = stamp.map(Number);
    return new Date(year, month - 1, day, hour, minute, second);
  }

  read(assetClass: AssetClass): unknown {
    return JSON.parse(readFileSync(this.fileFor(assetClass), "utf8"));
  }

  private fileFor(assetClass: AssetClass): string {
    const matches = this.entries().filter((name) => name.endsWith(`-${assetClass}.json`));
    if (matches.length !== 1) {
      throw new Error(
        `expected exactly one "*-${assetClass}.json" in ${this.folder}, found ${matches.length}`,
      );
    }
    return path.join(this.folder, matches[0]);
  }

  /** Falls back to the date every export file is prefixed with. */
  private takenAtFromFileNames(): Date {
    const stamp = this.entries().map((name) => FILE_STAMP.exec(name)).find(Boolean);
    if (!stamp) {
      throw new Error(`cannot tell when ${this.folder} was captured: no dated folder or file name`);
    }
    const [, year, month, day] = stamp.map(Number);
    return new Date(year, month - 1, day);
  }

  private entries(): string[] {
    try {
      return readdirSync(this.folder).sort();
    } catch {
      throw new Error(`snapshot folder not readable: ${this.folder}`);
    }
  }
}
