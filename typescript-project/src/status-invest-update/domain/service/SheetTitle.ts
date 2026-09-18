import { pad2 } from "./formatting";

/** Builds tab titles like `acoes-br-2026-09-28-18h00m`. */
export class SheetTitle {
  constructor(private readonly clock: () => Date = () => new Date()) {}

  for(name: string): string {
    const now = this.clock();
    const date = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
    return `${name}-${date}-${pad2(now.getHours())}h${pad2(now.getMinutes())}m`;
  }
}
