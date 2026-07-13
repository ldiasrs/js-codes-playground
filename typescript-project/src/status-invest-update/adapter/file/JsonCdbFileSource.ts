import { readFileSync } from "fs";
import { CdbPosition } from "../../domain/model/CdbPosition";
import { CdbSource } from "../../application/port/CdbSource";

/**
 * Reads the Status Invest CDB export: a flat JSON array of fixed-income
 * positions. The file usually has no extension, so it is read as raw text.
 */
export class JsonCdbFileSource implements CdbSource {
  constructor(private readonly filePath: string) {}

  load(): CdbPosition[] {
    const data = JSON.parse(readFileSync(this.filePath, "utf8"));
    if (!Array.isArray(data) || !data.length) {
      throw new Error(`expected a non-empty JSON array in ${this.filePath}`);
    }
    return data;
  }
}
