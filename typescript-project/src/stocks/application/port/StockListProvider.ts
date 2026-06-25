import { Stock } from "../../domain/model/Stock";

/** Driven port: where the watchlist comes from. */
export interface StockListProvider {
  load(): Promise<Stock[]>;
}
