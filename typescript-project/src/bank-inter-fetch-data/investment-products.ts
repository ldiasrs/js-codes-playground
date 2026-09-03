export type InvestmentProduct = {
  readonly id: string;
  readonly fileSuffix: string;
  readonly path: string;
  readonly includeDateQuery: boolean;
};

export const INVESTMENT_PRODUCTS: readonly InvestmentProduct[] = [
  {
    id: "renda-variavel",
    fileSuffix: "acoes-br",
    path: "/ib-pfj/investimentos/v1/extrato/renda-variavel/posicao",
    includeDateQuery: false,
  },
  {
    id: "fundos",
    fileSuffix: "fundos",
    path: "/ib-pfj/investimentos/v1/extrato/fundos/posicao",
    includeDateQuery: true,
  },
  {
    id: "renda-fixa",
    fileSuffix: "renda-fixa",
    path: "/ib-pfj/investimentos/v1/extrato/renda-fixa/posicao",
    includeDateQuery: true,
  },
];
