import path from "path";
import { SnapshotUpdateUseCase } from "../SnapshotUpdateUseCase";
import { ExportWriter } from "../port/ExportWriter";
import { ExportDefinition } from "../../domain/model/ExportDefinition";
import { SheetNamer } from "../../adapter/sheet/SheetNamer";

class RecordingWriter implements ExportWriter {
  readonly definitions: ExportDefinition[] = [];

  async write(definition: ExportDefinition): Promise<string> {
    this.definitions.push(definition);
    return `https://example.test/${definition.group}`;
  }
}

describe("SnapshotUpdateUseCase", () => {
  const sourceFolder = path.resolve(
    __dirname,
    "../../../../data/investimentos/historico-investimentos/2026-09-17-12h53m13",
  );

  it("exports the four configured history documents with compact timestamped tab names", async () => {
    const writer = new RecordingWriter();
    const namer = new SheetNamer(() => new Date(2026, 8, 18, 14, 0, 0));

    const results = await new SnapshotUpdateUseCase(sourceFolder, writer, namer).execute();

    expect(results.map((result) => result.group)).toEqual([
      "acoes-br",
      "fundos",
      "renda-fixa",
      "resumo",
    ]);
    expect(writer.definitions.map((definition) => definition.sheetTitle)).toEqual([
      "acoes-br-2026-09-18-1400",
      "fundos-2026-09-18-1400",
      "renda-fixa-2026-09-18-1400",
      "resumo-2026-09-18-1400",
    ]);
    expect(writer.definitions[0].headers.slice(0, 2)).toEqual(["%-ganho-mensal", "%-ganho-anual"]);
    expect(writer.definitions[0].headers).toContain("codPapel");
    expect(writer.definitions[1].headers).toContain("produto");
    expect(writer.definitions[1].rows[0].dataCotacao).toBeInstanceOf(Date);
    expect(writer.definitions[2].headers).toContain("numeroNota");
    expect(typeof writer.definitions[2].rows[0].numeroNota).toBe("string");
    expect(writer.definitions[2].rows[0].dataOperacao).toBeInstanceOf(Date);
    expect(writer.definitions[2].rows[0].dataVencimento).toBeInstanceOf(Date);
    expect(writer.definitions[0].formulas?.[0]["%-ganho-anual"]).toBe("=IFERROR((I2-D2)/D2,0)");
    expect(writer.definitions[3].headers).toEqual([
      "categoria",
      "valor-investido",
      "valor-atual",
      "%-ganho-mensal",
      "%-ganho-anual",
    ]);
    expect(writer.definitions[3].formulas?.[0]["%-ganho-anual"]).toBe("=IFERROR((C2-B2)/B2,0)");
  });
});
