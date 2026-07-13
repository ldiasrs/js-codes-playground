import { Transaction } from "../model/Transaction";

/** Groups transactions by category, each group ordered by referenceDate ascending. */
export class TransactionGrouper {
  group(transactions: readonly Transaction[]): Map<string, Transaction[]> {
    const groups = new Map<string, Transaction[]>();
    for (const transaction of transactions) {
      const group = groups.get(transaction.categoryId) ?? [];
      group.push(transaction);
      groups.set(transaction.categoryId, group);
    }
    for (const group of groups.values()) {
      group.sort((a, b) => a.referenceDate.localeCompare(b.referenceDate));
    }
    return groups;
  }
}
