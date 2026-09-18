import { contractFor } from "../../model/AssetClassContract";
import { Column } from "../../model/Column";
import { Position } from "../../model/Position";
import { ANNUAL_RETURN, MONTHLY_RETURN, TOTAL_RETURN } from "../../model/ReturnColumns";
import { columnsOf } from "../../model/ReturnColumns";
import { ColumnReference } from "../ColumnReference";
import { ReturnFormulas } from "../ReturnFormulas";

const RENDA_FIXA = contractFor("renda-fixa");
const ACOES = contractFor("acoes-br");

const rendaFixaColumns: Column[] = [
  ...columnsOf(RENDA_FIXA.returnColumns),
  { id: "produto", kind: "text" },
  { id: "dataOperacao", kind: "date" },
  { id: "valorOperacao", kind: "money" },
  { id: "valorBruto", kind: "money" },
  { id: "valorRetirada", kind: "money" },
  { id: "valorLiquido", kind: "money" },
];

const acoesColumns: Column[] = [
  ...columnsOf(ACOES.returnColumns),
  { id: "custoMedio", kind: "money" },
  { id: "valorMercado", kind: "money" },
];

const formulas = new ReturnFormulas(new Date(2026, 8, 17, 12, 53, 13));
const position = (produto: string): Position => ({ produto });

describe("ReturnFormulas", () => {
  describe("renda-fixa", () => {
    const reference = new ColumnReference(rendaFixaColumns);

    it("compounds over the days held, skipping rows with no operation date", () => {
      const row = formulas.forRow(RENDA_FIXA, reference, position("CDB BMG"), 2);

      expect(row[ANNUAL_RETURN]).toBe(
        '=IF(D2=""; ""; IFERROR((F2/E2)^(365/(DATE(2026; 9; 17)-D2))-1; ""))',
      );
      expect(row[MONTHLY_RETURN]).toBe('=IF(B2=""; ""; B2/12)');
    });

    it("nets off withdrawals for a daily-liquidity CDB instead of compounding", () => {
      const row = formulas.forRow(RENDA_FIXA, reference, position("CDB LIQUIDEZ DIARIA"), 16);

      expect(row[ANNUAL_RETURN]).toBe('=IFERROR((H16/(E16-G16))-1; "")');
    });

    it("matches the daily-liquidity product however it is cased or spaced", () => {
      const row = formulas.forRow(RENDA_FIXA, reference, position(" cdb liquidez diaria "), 16);

      expect(row[ANNUAL_RETURN]).toBe('=IFERROR((H16/(E16-G16))-1; "")');
    });
  });

  describe("classes with no purchase date", () => {
    const reference = new ColumnReference(acoesColumns);

    it("states a total return and shows no monthly column at all", () => {
      const row = formulas.forRow(ACOES, reference, {}, 2);

      expect(row[TOTAL_RETURN]).toBe('=IFERROR((C2/B2)-1; "")');
      expect(Object.keys(row)).toEqual([TOTAL_RETURN]);
    });
  });
});
