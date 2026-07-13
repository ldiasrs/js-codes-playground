import { readFileSync } from "fs";
import { Transaction } from "../../domain/model/Transaction";
import { TransactionSource } from "../../application/port/TransactionSource";

/**
 * Reads the Status Invest transactions export: a JSON array whose first
 * element holds the records under `walletPositionHistoryModels`.
 */
export class JsonTransactionFileSource implements TransactionSource {
  constructor(private readonly filePath: string) {}

  load(): Transaction[] {
    const data = JSON.parse(readFileSync(this.filePath, "utf8"));
    const records = Array.isArray(data)
      ? data.flatMap((entry) => entry?.walletPositionHistoryModels ?? [])
      : [];
    if (!records.length) {
      throw new Error(
        `no "walletPositionHistoryModels" records found in ${this.filePath}`,
      );
    }
    return records;
  }
}
