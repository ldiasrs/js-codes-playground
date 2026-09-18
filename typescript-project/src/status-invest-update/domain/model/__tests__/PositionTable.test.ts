import { Column } from "../Column";
import { createPositionTable } from "../PositionTable";

describe("createPositionTable", () => {
  /** Enough to satisfy the renda-fixa default basis and its override. */
  const valid: Column[] = [
    { id: "produto", kind: "text" },
    { id: "valorOperacao", kind: "money" },
    { id: "valorBruto", kind: "money" },
    { id: "valorRetirada", kind: "money" },
    { id: "valorLiquido", kind: "money" },
    { id: "dataOperacao", kind: "date" },
  ];

  const without = (columnId: string) => valid.filter((column) => column.id !== columnId);

  it("accepts a table that supplies every column its contract needs", () => {
    expect(createPositionTable("renda-fixa", valid, []).assetClass).toBe("renda-fixa");
  });

  it("rejects a provider that omits a column the return formulas read", () => {
    expect(() => createPositionTable("renda-fixa", without("dataOperacao"), [])).toThrow(
      '"renda-fixa" is missing its startDateColumn "dataOperacao"',
    );
  });

  it("rejects a provider that omits a column only an override reads", () => {
    expect(() => createPositionTable("renda-fixa", without("valorRetirada"), [])).toThrow(
      '"renda-fixa" is missing its withdrawnColumn "valorRetirada"',
    );
  });

  it("rejects a provider that omits the column an override switches on", () => {
    expect(() => createPositionTable("renda-fixa", without("produto"), [])).toThrow(
      '"renda-fixa" is missing its override condition "produto"',
    );
  });

  it("rejects a column that cannot be read the way the formulas assume", () => {
    const wrongKind: Column[] = valid.map((column) =>
      column.id === "valorBruto" ? { id: column.id, kind: "text" } : column,
    );

    expect(() => createPositionTable("renda-fixa", wrongKind, [])).toThrow(
      'column "valorBruto" must be money, got text',
    );
  });
});
