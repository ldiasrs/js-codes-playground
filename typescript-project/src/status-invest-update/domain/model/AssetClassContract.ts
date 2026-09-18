import { AssetClass } from "./AssetClass";
import { CellValue } from "./Column";
import { Position } from "./Position";
import { ReturnBasis } from "./ReturnBasis";
import { ANNUALISED_WITH_MONTHLY, ReturnColumnSet, TOTAL_ONLY } from "./ReturnColumns";

/** A product whose return has to be read differently from the rest of its class. */
export interface BasisOverride {
  readonly whenColumn: string;
  /** Matched against the column's value, ignoring case and surrounding space. */
  readonly equals: string;
  readonly basis: ReturnBasis;
}

/**
 * The canonical contract for an asset class: the label it is summarised under,
 * the profit columns it shows, and the columns those formulas read.
 *
 * This is the vocabulary a new provider maps onto. The column names borrow the
 * Status Invest field names because that is the wallet this started from, but
 * they are provider-neutral from here on: a provider is free to name its own
 * extra columns anything, as long as it supplies these.
 */
export interface AssetClassContract {
  readonly assetClass: AssetClass;
  readonly label: string;
  readonly returnColumns: ReturnColumnSet;
  readonly returnBasis: ReturnBasis;
  readonly basisOverrides: readonly BasisOverride[];
}

/**
 * Daily-liquidity CDBs are drawn down in parts rather than held to maturity, so
 * a rate compounded from the operation date says nothing useful. Their return
 * is what is left over what is still in: `valorLiquido / (valorOperacao -
 * valorRetirada) - 1`.
 */
const DAILY_LIQUIDITY_CDB: BasisOverride = {
  whenColumn: "produto",
  equals: "CDB LIQUIDEZ DIARIA",
  basis: {
    investedColumn: "valorOperacao",
    withdrawnColumn: "valorRetirada",
    currentColumn: "valorLiquido",
  },
};

const CONTRACTS: Record<AssetClass, AssetClassContract> = {
  "acoes-br": {
    assetClass: "acoes-br",
    label: "Ações BR",
    returnColumns: TOTAL_ONLY,
    returnBasis: { investedColumn: "custoMedio", currentColumn: "valorMercado" },
    basisOverrides: [],
  },
  fundos: {
    assetClass: "fundos",
    label: "Fundos",
    returnColumns: TOTAL_ONLY,
    returnBasis: { investedColumn: "valorNominal", currentColumn: "valorBruto" },
    basisOverrides: [],
  },
  "renda-fixa": {
    assetClass: "renda-fixa",
    label: "Renda Fixa",
    returnColumns: ANNUALISED_WITH_MONTHLY,
    returnBasis: {
      investedColumn: "valorOperacao",
      currentColumn: "valorBruto",
      startDateColumn: "dataOperacao",
    },
    basisOverrides: [DAILY_LIQUIDITY_CDB],
  },
};

export function contractFor(assetClass: AssetClass): AssetClassContract {
  return CONTRACTS[assetClass];
}

/** Every basis the class can apply — the default plus each override's. */
export function allBasesOf(contract: AssetClassContract): ReturnBasis[] {
  return [contract.returnBasis, ...contract.basisOverrides.map((override) => override.basis)];
}

/** The first override that claims this position, or the class default. */
export function basisFor(contract: AssetClassContract, position: Position): ReturnBasis {
  const override = contract.basisOverrides.find((candidate) =>
    matches(position[candidate.whenColumn], candidate.equals),
  );
  return override?.basis ?? contract.returnBasis;
}

function matches(value: CellValue, expected: string): boolean {
  return typeof value === "string" && value.trim().toUpperCase() === expected.toUpperCase();
}
