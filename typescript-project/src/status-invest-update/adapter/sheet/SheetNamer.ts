/** Builds sheet-tab-safe timestamped titles, e.g. "Acoes-2026-07-13-10h11m30s". */
export class SheetNamer {
  constructor(private readonly clock: () => Date = () => new Date()) {}

  name(group: string): string {
    const now = this.clock();
    const p = (n: number) => String(n).padStart(2, "0");
    const date = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
    const time = `${p(now.getHours())}h${p(now.getMinutes())}m${p(now.getSeconds())}s`;
    return `${group}-${date}-${time}`;
  }

  /** Compact snapshot title, e.g. "acoes-br-2026-09-18-1400". */
  snapshotName(group: string): string {
    const now = this.clock();
    const p = (n: number) => String(n).padStart(2, "0");
    const date = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
    return `${group}-${date}-${p(now.getHours())}${p(now.getMinutes())}`;
  }
}
