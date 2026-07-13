import { Transaction } from "../../domain/model/Transaction";

export interface TransactionSource {
  load(): Transaction[];
}
