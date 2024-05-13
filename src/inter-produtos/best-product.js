import { readFile2 } from "../commons.js";

import moment from "moment";

const bestInvestProduct = {
  taxaEmPorcentagem: 1,
  tipo: "CDB",
  indexador: "DI", //DI ou IPCA
  aplicacaoMinima: 0,
  resgate: "22/01/2035",
  grauRisco: 5,
  garantidoFgc: true,
};

const extractTaxaFromText = (text) => {
  const taxa = text.match(/(\d+,?\d*)%/);
  return taxa ? Number(taxa[1].replace(",", ".")) : 0;
};

const mapToBestInvestProducts = (products) => {
  return products.map((product) => {
    return {
      taxaEmPorcentagem: extractTaxaFromText(product.taxa),
      tipo: product.tipo.descricao,
      indexador: product.indexador.descricao,
      aplicacaoMinima: product.aplicacaoMinima,
      resgate: product.resgate,
      grauRisco: product.grauRisco,
      garantidoFgc: product.garantidoFgc,
      grossUp: product.grossUp,
      nome: product.nome,
    };
  });
};

const filterInvestProducts = (investProducts, filterOptions) => {
  const investProductsFiltered = investProducts
    .filter((invest) => invest.tipo === filterOptions.tipo)
    .filter((invest) => invest.indexador === filterOptions.indexador)
    .filter(
      (invest) => invest.taxaEmPorcentagem >= filterOptions.taxaEmPorcentagem
    )
    .filter((invest) => invest.grauRisco < filterOptions.grauRisco)
    .sort(
      (a, b) =>
        moment(a.resgate, "DD/MM/YYYY") - moment(b.resgate, "DD/MM/YYYY")
    )
    .sort((a, b) => (a.grauRisco < b.grauRisco ? -1 : 1))
    .sort((a, b) => b.taxaEmPorcentagem - a.taxaEmPorcentagem);
  return {
    filterName: `${filterOptions.tipo} ${filterOptions.indexador}`,
    investProducts: investProductsFiltered,
  };
};
const products = await readFile2("data/produtos-para-investir.json");
const investProducts = mapToBestInvestProducts(JSON.parse(products));

const cdbDi = filterInvestProducts(investProducts, {
  tipo: "CDB",
  indexador: "DI",
  taxaEmPorcentagem: 120,
  grauRisco: 5,
});

const cdbIpca = filterInvestProducts(investProducts, {
  tipo: "CDB",
  indexador: "IPCA",
  taxaEmPorcentagem: 5,
  grauRisco: 5,
});

const cdbPre = filterInvestProducts(investProducts, {
  tipo: "CDB",
  indexador: "PRE",
  taxaEmPorcentagem: 11,
  grauRisco: 5,
});

const lciDi = filterInvestProducts(investProducts, {
  tipo: "LCI",
  indexador: "DI",
  taxaEmPorcentagem: 100,
  grauRisco: 5,
});

const lciIpca = filterInvestProducts(investProducts, {
  tipo: "LCI",
  indexador: "IPCA",
  taxaEmPorcentagem: 5,
  grauRisco: 5,
});

const allProducts = [cdbPre, cdbDi, cdbIpca, lciDi, lciIpca];

console.log(JSON.stringify(allProducts, null, 2));
