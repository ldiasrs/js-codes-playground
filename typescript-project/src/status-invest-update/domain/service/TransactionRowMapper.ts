import moment from "moment";
import { Transaction } from "../model/Transaction";
import { ExportRow } from "../model/ExportDefinition";

export const TRANSACTION_HEADERS = [
  "referenceDate",
  "brokerId",
  "broker",
  "code",
  "name",
  "operationType",
  "quantity",
  "lineStatus",
  "unitValue",
  "totalValue",
] as const;

export class TransactionRowMapper {
  readonly headers = TRANSACTION_HEADERS;

  toRow(transaction: Transaction): ExportRow {
    return {
      referenceDate: moment(transaction.referenceDate).format("DD/MM/YYYY"),
      brokerId: transaction.brokerId,
      broker: transaction.broker,
      code: transaction.code,
      name: transaction.name,
      operationType: transaction.operationType,
      quantity: transaction.quantity,
      lineStatus: transaction.lineStatus,
      unitValue: transaction.unitValue,
      totalValue: transaction.totalValue,
    };
  }
}
