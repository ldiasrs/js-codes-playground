import { Column } from "../../model/Column";
import { TOTAL_RETURN } from "../../model/ReturnColumns";
import { SheetTitle } from "../SheetTitle";
import { SummarySheetFactory } from "../SummarySheetFactory";

const acoesColumns: Column[] = [
  { id: TOTAL_RETURN, kind: "percent" },
  { id: "custoMedio", kind: "money" },
  { id: "valorMercado", kind: "money" },
];

const title = new SheetTitle(() => new Date(2026, 8, 28, 18, 0, 0));

describe("SummarySheetFactory", () => {
  const summary = new SummarySheetFactory(title).build([
    { assetClass: "acoes-br", title: "acoes-br-2026-09-28-18h00m", columns: acoesColumns },
  ]);

  it("names the tab, labels every category plus a total, and shows only %-total", () => {
    expect(summary.title).toBe("resumo-2026-09-28-18h00m");
    expect(summary.rows.map((row) => row.categoria)).toEqual(["Ações BR", "Total"]);
    expect(summary.columns.map((column) => column.id)).toEqual([
      "categoria",
      "valor-investido",
      "valor-atual",
      TOTAL_RETURN,
    ]);
  });

  it("sums each category straight out of the tab it was published to", () => {
    expect(summary.formulas[0]["valor-investido"]).toBe(
      "=SUM('acoes-br-2026-09-28-18h00m'!B2:B)",
    );
    expect(summary.formulas[0]["valor-atual"]).toBe("=SUM('acoes-br-2026-09-28-18h00m'!C2:C)");
  });

  it("totals the category rows and derives the return from them", () => {
    expect(summary.formulas[1]["valor-investido"]).toBe("=SUM(B2:B2)");
    expect(summary.formulas[1][TOTAL_RETURN]).toBe('=IFERROR((C3/B3)-1; "")');
  });
});
