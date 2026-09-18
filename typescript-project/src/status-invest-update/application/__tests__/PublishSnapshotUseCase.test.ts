import path from "path";
import { SnapshotFolder } from "../../adapter/provider/status-invest/SnapshotFolder";
import { StatusInvestSnapshotSource } from "../../adapter/provider/status-invest/StatusInvestSnapshotSource";
import { contractFor } from "../../domain/model/AssetClassContract";
import { ANNUAL_RETURN, MONTHLY_RETURN, TOTAL_RETURN } from "../../domain/model/ReturnColumns";
import { PublishedSheet, SheetDefinition } from "../../domain/model/SheetDefinition";
import { InvestmentSheetFactory } from "../../domain/service/InvestmentSheetFactory";
import { PositionReturn } from "../../domain/service/PositionReturn";
import { ReturnFormulas } from "../../domain/service/ReturnFormulas";
import { SheetTitle } from "../../domain/service/SheetTitle";
import { SummarySheetFactory } from "../../domain/service/SummarySheetFactory";
import { SheetPublisher } from "../port/SheetPublisher";
import { PublishSnapshotUseCase } from "../PublishSnapshotUseCase";

class RecordingPublisher implements SheetPublisher {
  readonly definitions: SheetDefinition[] = [];

  async publish(definition: SheetDefinition): Promise<PublishedSheet> {
    this.definitions.push(definition);
    return { title: definition.title, rowCount: definition.rows.length, url: "recorded" };
  }
}

const SNAPSHOT = path.resolve(
  __dirname,
  "../../../../data/investimentos/historico-investimentos/2026-09-17-12h53m13",
);

describe("PublishSnapshotUseCase", () => {
  const publisher = new RecordingPublisher();
  const folder = new SnapshotFolder(SNAPSHOT);
  const title = new SheetTitle(() => new Date(2026, 8, 28, 18, 0, 0));

  const published = new PublishSnapshotUseCase(
    new StatusInvestSnapshotSource(folder),
    publisher,
    new InvestmentSheetFactory(
      new ReturnFormulas(folder.takenAt()),
      new PositionReturn(folder.takenAt()),
      title,
    ),
    new SummarySheetFactory(title),
  ).execute();

  const definitionFor = (name: string) =>
    publisher.definitions.find((definition) => definition.title.startsWith(name))!;

  beforeAll(async () => {
    await published;
  });

  it("publishes one dated tab per asset class plus the summary, in canonical order", async () => {
    expect((await published).map((sheet) => sheet.title)).toEqual([
      "acoes-br-2026-09-28-18h00m",
      "fundos-2026-09-28-18h00m",
      "renda-fixa-2026-09-28-18h00m",
      "resumo-2026-09-28-18h00m",
    ]);
  });

  it("leads renda-fixa with %-mes and %-ano, and the dateless classes with %-total alone", () => {
    expect(definitionFor("renda-fixa").columns.slice(0, 2).map((column) => column.id)).toEqual([
      MONTHLY_RETURN,
      ANNUAL_RETURN,
    ]);
    for (const name of ["acoes-br", "fundos"]) {
      expect(definitionFor(name).columns[0].id).toBe(TOTAL_RETURN);
      expect(definitionFor(name).columns.map((column) => column.id)).not.toContain(MONTHLY_RETURN);
    }
  });

  it("flattens fixed income to one row per note and compounds each from its own date", () => {
    const rendaFixa = definitionFor("renda-fixa");

    expect(rendaFixa.rows).toHaveLength(59);
    expect(rendaFixa.formulas[0][ANNUAL_RETURN]).toMatch(
      /^=IF\(H\d+=""; ""; IFERROR\(\(K\d+\/J\d+\)\^\(365\/\(DATE\(2026; 9; 17\)-H\d+\)\)-1; ""\)\)$/,
    );
  });

  it("gives every daily-liquidity CDB nota the withdrawal-aware formula", () => {
    const rendaFixa = definitionFor("renda-fixa");
    const daily = rendaFixa.rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => row.produto === "CDB LIQUIDEZ DIARIA");

    expect(daily).toHaveLength(7);
    for (const { index } of daily) {
      const sheetRow = index + 2;
      expect(rendaFixa.formulas[index][ANNUAL_RETURN]).toBe(
        `=IFERROR((Q${sheetRow}/(J${sheetRow}-M${sheetRow}))-1; "")`,
      );
    }
  });

  it("reads the dd/MM/yyyy dates that used to come through blank", () => {
    const rendaFixa = definitionFor("renda-fixa");
    const daily = rendaFixa.rows.filter((row) => row.produto === "CDB LIQUIDEZ DIARIA");

    expect(daily.every((row) => row.dataOperacao instanceof Date)).toBe(true);
  });

  it("orders every tab by its headline return, worst first, blanks last", () => {
    for (const [name, headline] of [
      ["acoes-br", TOTAL_RETURN],
      ["fundos", TOTAL_RETURN],
      ["renda-fixa", ANNUAL_RETURN],
    ] as const) {
      const definition = definitionFor(name);
      const contract = contractFor(name);
      const returns = definition.rows.map((row) =>
        new PositionReturn(folder.takenAt()).of(contract, row),
      );
      const ranked = returns.filter((value): value is number => value !== null);

      expect(ranked).toEqual([...ranked].sort((left, right) => left - right));
      expect(returns.slice(ranked.length).every((value) => value === null)).toBe(true);
    }
  });

  it("makes every summary figure a formula over the tabs it just published", () => {
    const resumo = definitionFor("resumo");

    expect(resumo.rows.map((row) => row.categoria)).toEqual([
      "Ações BR",
      "Fundos",
      "Renda Fixa",
      "Total",
    ]);
    expect(resumo.formulas[2]["valor-investido"]).toBe(
      "=SUM('renda-fixa-2026-09-28-18h00m'!J2:J)",
    );
    expect(resumo.formulas[3]["valor-atual"]).toBe("=SUM(C2:C4)");
    expect(resumo.formulas[3][TOTAL_RETURN]).toBe('=IFERROR((C5/B5)-1; "")');
  });

  it("carries only real numbers and dates into the cells", () => {
    const rendaFixa = definitionFor("renda-fixa");

    expect(rendaFixa.rows[0].dataOperacao).toBeInstanceOf(Date);
    expect(typeof rendaFixa.rows[0].valorOperacao).toBe("number");
    expect(typeof rendaFixa.rows[0].numeroNota).toBe("string");
  });
});
