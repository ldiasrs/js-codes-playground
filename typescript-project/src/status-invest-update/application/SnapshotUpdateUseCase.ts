import { existsSync, readFileSync, readdirSync } from "fs";
import path from "path";
import { ExportWriter } from "./port/ExportWriter";
import { ExportDefinition, ExportRow } from "../domain/model/ExportDefinition";
import { SheetNamer } from "../adapter/sheet/SheetNamer";

const INVESTMENT_GROUPS = ["acoes-br", "fundos", "renda-fixa"] as const;
type InvestmentGroup = (typeof INVESTMENT_GROUPS)[number];
type JsonObject = Record<string, unknown>;

/** Exports three investment tabs plus a formula-driven consolidated summary. */
export class SnapshotUpdateUseCase {
  constructor(
    private readonly sourceFolder: string,
    private readonly exportWriter: ExportWriter,
    private readonly namer: SheetNamer = new SheetNamer(),
  ) {}

  async execute(): Promise<{ group: string; rowCount: number; url: string }[]> {
    const investments = INVESTMENT_GROUPS.map((group) => this.investmentDefinition(group));
    const definitions = [...investments, this.summaryDefinition(investments)];
    const results: { group: string; rowCount: number; url: string }[] = [];
    for (const definition of definitions) {
      const url = await this.exportWriter.write(definition);
      results.push({ group: definition.group, rowCount: definition.rows.length, url });
    }
    return results;
  }

  private investmentDefinition(group: InvestmentGroup): ExportDefinition {
    const content = JSON.parse(readFileSync(this.findFile(group), "utf8")) as JsonObject;
    const dataRows = investmentRows(content);
    const headers = ["%-ganho-mensal", "%-ganho-anual", ...uniqueHeaders(dataRows)];
    const formulas = dataRows.map((_, index) => gainFormulas(group, headers, index + 2));
    const rows = dataRows.map((row) => ({ "%-ganho-mensal": "", "%-ganho-anual": "", ...row }));
    return { group, sheetTitle: this.namer.snapshotName(group), headers, rows, formulas };
  }

  private summaryDefinition(investments: ExportDefinition[]): ExportDefinition {
    const headers = ["categoria", "valor-investido", "valor-atual", "%-ganho-mensal", "%-ganho-anual"];
    const rows: ExportRow[] = [
      { categoria: "Ações BR", "valor-investido": "", "valor-atual": "", "%-ganho-mensal": "", "%-ganho-anual": "" },
      { categoria: "Fundos", "valor-investido": "", "valor-atual": "", "%-ganho-mensal": "", "%-ganho-anual": "" },
      { categoria: "Renda fixa", "valor-investido": "", "valor-atual": "", "%-ganho-mensal": "", "%-ganho-anual": "" },
      { categoria: "Total", "valor-investido": "", "valor-atual": "", "%-ganho-mensal": "", "%-ganho-anual": "" },
    ];
    const formulas = investments.map((definition, index) => summaryFormulas(definition, index + 2));
    formulas.push({
      "valor-investido": "=SUM(B2:B4)",
      "valor-atual": "=SUM(C2:C4)",
      "%-ganho-mensal": "=IFERROR((C5-B5)/B5/12,0)",
      "%-ganho-anual": "=IFERROR((C5-B5)/B5,0)",
    });
    return { group: "resumo", sheetTitle: this.namer.snapshotName("resumo"), headers, rows, formulas };
  }

  private findFile(group: string): string {
    const matches = readdirSync(this.sourceFolder).filter((name) => name.endsWith(`-${group}.json`)).sort();
    if (matches.length !== 1) {
      throw new Error(`expected exactly one "*-${group}.json" file in ${this.sourceFolder}; found ${matches.length}`);
    }
    const filename = path.join(this.sourceFolder, matches[0]);
    if (!existsSync(filename)) throw new Error(`snapshot file not found: ${filename}`);
    return filename;
  }
}

function gainFormulas(group: InvestmentGroup, headers: string[], row: number): Record<string, string> {
  const invested = group === "acoes-br" ? "custoMedio" : group === "fundos" ? "valorNominal" : "valorAplicadoTotal";
  const current = group === "acoes-br" ? "valorMercado" : "valorBruto";
  const appliedForProfit = group === "renda-fixa" ? "valorOperacao" : invested;
  const profit = `${columnLetter(headers.indexOf(current))}${row}-${columnLetter(headers.indexOf(appliedForProfit))}${row}`;
  const annual = `=IFERROR((${profit})/${columnLetter(headers.indexOf(invested))}${row},0)`;
  return { "%-ganho-mensal": `=B${row}/12`, "%-ganho-anual": annual };
}

function summaryFormulas(definition: ExportDefinition, row: number): Record<string, string> {
  const title = `'${definition.sheetTitle}'`;
  const source = (header: string) => columnLetter(definition.headers.indexOf(header));
  const invested = definition.group === "acoes-br" ? "custoMedio" : definition.group === "fundos" ? "valorNominal" : "valorOperacao";
  const current = definition.group === "acoes-br" ? "valorMercado" : "valorBruto";
  return {
    "valor-investido": `=SUM(${title}!${source(invested)}2:${source(invested)})`,
    "valor-atual": `=SUM(${title}!${source(current)}2:${source(current)})`,
    "%-ganho-mensal": `=IFERROR((C${row}-B${row})/B${row}/12,0)`,
    "%-ganho-anual": `=IFERROR((C${row}-B${row})/B${row},0)`,
  };
}

function columnLetter(index: number): string {
  if (index < 0) throw new Error("snapshot formula references a missing column");
  let value = index + 1;
  let result = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result;
}

function investmentRows(content: JsonObject): ExportRow[] {
  const data = content.data;
  if (!Array.isArray(data)) throw new Error('snapshot investment file must contain a "data" array');
  return data.flatMap((item) => {
    if (!isObject(item)) return [{ value: formatValue(item) }];
    const { notas, ...position } = item;
    if (!Array.isArray(notas)) return [toRow(position)];
    return notas.map((note) => ({ ...toRow(position), ...toRow(isObject(note) ? note : { nota: note }) }));
  });
}

function toRow(value: JsonObject): ExportRow {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, formatValue(item, key)]));
}

function uniqueHeaders(rows: ExportRow[]): string[] {
  return [...new Set(rows.flatMap((row) => Object.keys(row)))];
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatValue(value: unknown, key = ""): string | number | Date {
  // Note numbers are identifiers, not quantities. Preserve every digit and avoid
  // Google Sheets applying numeric/scientific notation to them.
  if (key === "numeroNota") return value == null ? "" : String(value);
  if (typeof value === "string") {
    const isoDate = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(value);
    if (isoDate) {
      // Construct in local time so the displayed Brazilian date never shifts a
      // day because of the spreadsheet/account time zone.
      const [, year, month, day] = isoDate;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
  }
  if (typeof value === "number" && /percentual/i.test(key)) return value / 100;
  return typeof value === "number" || typeof value === "string" ? value : value == null ? "" : JSON.stringify(value);
}
