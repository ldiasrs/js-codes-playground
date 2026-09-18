import { AcoesBrMapper } from "../AcoesBrMapper";
import { FundosMapper } from "../FundosMapper";
import { RendaFixaMapper } from "../RendaFixaMapper";

describe("AcoesBrMapper", () => {
  const table = new AcoesBrMapper().map({
    data: [{ codPapel: "AGRO3", custoMedio: 26430, percentualRetorno: -30.53, qtdeDisp: 1000, valorMercado: 18360 }],
  });

  it("scales percentages to the fraction a percent cell expects", () => {
    expect(table.positions[0].percentualRetorno).toBeCloseTo(-0.3053, 6);
  });

  it("leaves columns the export omitted empty rather than zero", () => {
    expect(table.positions[0].precoMercado).toBeNull();
  });
});

describe("FundosMapper", () => {
  const table = new FundosMapper().map({
    data: [{ produto: "INTER CORPORATE FIRF CP", dataCotacao: "2026-09-16", valorNominal: 15412.17, valorBruto: 20063.22 }],
  });

  it("reads the quota date as a real date on the local calendar day", () => {
    expect(table.positions[0].dataCotacao).toEqual(new Date(2026, 8, 16));
  });
});

describe("RendaFixaMapper", () => {
  it("reads both date spellings the same export mixes", () => {
    const table = new RendaFixaMapper().map({
      data: [
        {
          produto: "CDB LIQUIDEZ DIARIA",
          notas: [
            { numeroNota: 355029963, dataOperacao: "16/06/2025", dataVencimento: "07/06/2027", valorOperacao: 10000, valorBruto: 3213.92 },
            { numeroNota: 1808014, dataOperacao: "2021-03-10", dataVencimento: "2027-03-16", valorOperacao: 5782.13, valorBruto: 9796.29 },
          ],
        },
      ],
    });

    expect(table.positions[0].dataOperacao).toEqual(new Date(2025, 5, 16));
    expect(table.positions[0].dataVencimento).toEqual(new Date(2027, 5, 7));
    expect(table.positions[1].dataOperacao).toEqual(new Date(2021, 2, 10));
  });

  const table = new RendaFixaMapper().map({
    data: [
      {
        produto: "CDB BMG",
        mercado: "SECUNDARIO",
        valorAplicadoTotal: 17833.58,
        notas: [
          { numeroNota: 1808014, dataOperacao: "2021-03-10", tipo: "CDB", valorOperacao: 5782.13, valorBruto: 9796.29 },
          { numeroNota: 1053811, dataOperacao: "2020-08-05", tipo: "CDB", valorOperacao: 5045.45, valorBruto: 8454.51 },
        ],
      },
    ],
  });

  it("emits one row per note, repeating the product it belongs to", () => {
    expect(table.positions).toHaveLength(2);
    expect(table.positions.map((row) => row.produto)).toEqual(["CDB BMG", "CDB BMG"]);
    expect(table.positions.map((row) => row.numeroNota)).toEqual(["1808014", "1053811"]);
  });

  it("keeps note numbers as text so no digit is reformatted away", () => {
    expect(typeof table.positions[0].numeroNota).toBe("string");
  });

  it("leaves out the product totals that would double-count under a column sum", () => {
    expect(table.columns.map((column) => column.id)).not.toContain("valorAplicadoTotal");
  });
});
