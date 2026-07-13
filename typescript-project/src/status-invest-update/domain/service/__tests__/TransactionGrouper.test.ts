import { TransactionGrouper } from "../TransactionGrouper";
import { Transaction } from "../../model/Transaction";

const transaction = (overrides: Partial<Transaction>): Transaction => ({
  referenceDate: "2026-01-01T00:00:00",
  brokerId: 1,
  broker: "BROKER",
  code: "CODE",
  name: "NAME",
  categoryId: "Acoes",
  operationType: "Buy",
  quantity: 1,
  lineStatus: "Ok",
  unitValue: 10,
  totalValue: 10,
  ...overrides,
});

describe("TransactionGrouper", () => {
  const grouper = new TransactionGrouper();

  it("groups transactions by categoryId", () => {
    const groups = grouper.group([
      transaction({ categoryId: "Acoes", code: "PETR4" }),
      transaction({ categoryId: "Stocks", code: "AAPL" }),
      transaction({ categoryId: "Acoes", code: "VALE3" }),
    ]);

    expect([...groups.keys()]).toEqual(["Acoes", "Stocks"]);
    expect(groups.get("Acoes")!.map((t) => t.code)).toEqual(["PETR4", "VALE3"]);
    expect(groups.get("Stocks")!.map((t) => t.code)).toEqual(["AAPL"]);
  });

  it("sorts each group by referenceDate ascending", () => {
    const groups = grouper.group([
      transaction({ code: "C", referenceDate: "2026-07-03T00:00:00" }),
      transaction({ code: "A", referenceDate: "2025-01-15T00:00:00" }),
      transaction({ code: "B", referenceDate: "2025-12-31T00:00:00" }),
    ]);

    expect(groups.get("Acoes")!.map((t) => t.code)).toEqual(["A", "B", "C"]);
  });

  it("returns an empty map for no transactions", () => {
    expect(grouper.group([]).size).toBe(0);
  });
});
