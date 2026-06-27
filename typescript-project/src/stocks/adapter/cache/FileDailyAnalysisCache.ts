import * as fs from "fs";
import * as path from "path";
import { AnalysisCache } from "../../application/port/AnalysisCache";
import { Clock } from "../../application/port/Clock";
import { StockAnalysis } from "../../domain/model/StockAnalysis";

/**
 * Per-day JSON cache at <dir>/<YYYY-MM-DD>.json (a map of key → StockAnalysis).
 * Because the filename is the date, yesterday's file is never read — the cache
 * naturally expires daily. Loaded once into memory; written on every put (Node's
 * synchronous writes serialize, so concurrent puts are safe).
 */
/** Bump when the cached StockAnalysis shape changes, so old files are ignored. */
const SCHEMA_VERSION = "v2";

export class FileDailyAnalysisCache implements AnalysisCache {
  readonly file: string;
  readonly date: string;
  private map: Record<string, StockAnalysis> | null = null;
  hits = 0;
  misses = 0;

  constructor(dir: string, clock: Clock) {
    const d = clock.now();
    const p = (n: number) => String(n).padStart(2, "0");
    this.date = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    this.file = path.join(dir, `${this.date}.${SCHEMA_VERSION}.json`);
  }

  get(key: string): StockAnalysis | null {
    const value = this.load()[key] ?? null;
    if (value) this.hits++;
    else this.misses++;
    return value;
  }

  put(key: string, analysis: StockAnalysis): void {
    const map = this.load();
    map[key] = analysis;
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(this.file, JSON.stringify(map, null, 2), "utf8");
  }

  private load(): Record<string, StockAnalysis> {
    if (this.map) return this.map;
    try {
      this.map = JSON.parse(fs.readFileSync(this.file, "utf8"));
    } catch {
      this.map = {};
    }
    return this.map!;
  }
}
