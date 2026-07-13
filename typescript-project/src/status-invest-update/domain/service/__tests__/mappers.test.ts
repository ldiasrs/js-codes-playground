import { TransactionRowMapper, TRANSACTION_HEADERS } from "../TransactionRowMapper";
import { CdbRowMapper, CDB_HEADERS } from "../CdbRowMapper";
import { Transaction } from "../../model/Transaction";
import { CdbPosition } from "../../model/CdbPosition";

describe("TransactionRowMapper", () => {
  const mapper = new TransactionRowMapper();

  const sample: Transaction = {
    referenceDate: "2026-07-03T00:00:00",
    brokerId: 230,
    broker: "BANCO INTER S.A.",
    code: "PETR4",
    name: "PETROBRAS PN",
    categoryId: "Acoes",
    operationType: "Buy",
    quantity: 100,
    lineStatus: "Ok",
    unitValue: 32.5,
    totalValue: 3250,
  };

  it("produces exactly the expected columns in order", () => {
    expect(Object.keys(mapper.toRow(sample))).toEqual([...TRANSACTION_HEADERS]);
  });

  it("formats referenceDate as DD/MM/YYYY and keeps numbers raw", () => {
    const row = mapper.toRow(sample);
    expect(row.referenceDate).toBe("03/07/2026");
    expect(row.quantity).toBe(100);
    expect(row.unitValue).toBe(32.5);
    expect(row.totalValue).toBe(3250);
  });
});

describe("CdbRowMapper", () => {
  const mapper = new CdbRowMapper();

  const sample: CdbPosition = {
    referenceDate: "2026-07-10T00:00:00",
    brokerId: 120,
    brokerName: "BANCO PINE S/A",
    emissorId: 230,
    emissorName: "BANCO INTER S.A.",
    investimentType: "CDB",
    firstDate: "2025-03-11T00:00:00",
    expiredate: "2027-09-06T00:00:00",
    displayName: "(CDB) BANCO INTER S.A. 10,70% (06/09/27)",
    rateType: "PreFixado",
    indexerType: "Prefixado",
    rate: 10.7,
    currentValue: 11464.54,
    initalValue: 10011.37,
    ganhoBruto: 1453.17,
    withdrawalValue: 0,
  };

  it("produces exactly the expected columns in order", () => {
    expect(Object.keys(mapper.toRow(sample))).toEqual([...CDB_HEADERS]);
  });

  it("formats all date fields as DD/MM/YYYY and keeps numbers raw", () => {
    const row = mapper.toRow(sample);
    expect(row.referenceDate).toBe("10/07/2026");
    expect(row.firstDate).toBe("11/03/2025");
    expect(row.expiredate).toBe("06/09/2027");
    expect(row.rate).toBe(10.7);
    expect(row.ganhoBruto).toBe(1453.17);
    expect(row.withdrawalValue).toBe(0);
  });
});
