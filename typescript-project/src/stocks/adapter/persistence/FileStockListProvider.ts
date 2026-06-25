import * as fs from "fs";
import { Stock } from "../../domain/model/Stock";
import { StockListProvider } from "../../application/port/StockListProvider";

interface StockListFile {
  US?: string[];
  BR?: string[];
}

/** Reads the watchlist from data/stocks/stocks-list.json. */
export class FileStockListProvider implements StockListProvider {
  constructor(private readonly filePath: string) {}

  async load(): Promise<Stock[]> {
    const list = JSON.parse(fs.readFileSync(this.filePath, "utf8")) as StockListFile;
    const us = (list.US ?? []).map((ticker): Stock => ({ ticker, market: "US" }));
    const br = (list.BR ?? []).map((ticker): Stock => ({ ticker, market: "BR" }));
    return [...us, ...br];
  }
}
