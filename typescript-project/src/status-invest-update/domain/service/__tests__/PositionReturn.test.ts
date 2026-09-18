import { contractFor } from "../../model/AssetClassContract";
import { PositionReturn } from "../PositionReturn";

const RENDA_FIXA = contractFor("renda-fixa");
const ACOES = contractFor("acoes-br");

const positionReturn = new PositionReturn(new Date(2026, 8, 17));

describe("PositionReturn", () => {
  it("annualizes over the holding period, matching the contracted rate", () => {
    const value = positionReturn.of(RENDA_FIXA, {
      produto: "CDB BMG",
      dataOperacao: new Date(2021, 2, 10),
      valorOperacao: 5782.13,
      valorBruto: 9796.29,
    });

    expect(value).toBeCloseTo(0.1001, 4); // the nota's indexador reads "10% a.a."
  });

  it("nets off withdrawals for a daily-liquidity CDB", () => {
    const value = positionReturn.of(RENDA_FIXA, {
      produto: "CDB LIQUIDEZ DIARIA",
      dataOperacao: new Date(2025, 5, 16),
      valorOperacao: 10000,
      valorRetirada: 7650,
      valorLiquido: 3123.85,
    });

    expect(value).toBeCloseTo(3123.85 / (10000 - 7650) - 1, 6);
  });

  it("reads blank where the formula would: no date, or nothing invested", () => {
    expect(positionReturn.of(RENDA_FIXA, { valorOperacao: 100, valorBruto: 120 })).toBeNull();
    expect(positionReturn.of(ACOES, { custoMedio: 0, valorMercado: 0 })).toBeNull();
  });
});
