import { readFile2 } from "../commons.js";

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
  return investProducts
    .filter((invest) => invest.tipo === filterOptions.tipo)
    .filter((invest) => invest.indexador === filterOptions.indexador)
    .filter(
      (invest) => invest.taxaEmPorcentagem >= filterOptions.taxaEmPorcentagem
    )
    .filter((invest) => invest.grauRisco < filterOptions.grauRisco)
    .sort((a, b) => a.grauRisco - b.grauRisco)
    .sort((a, b) => b.taxaEmPorcentagem - a.taxaEmPorcentagem);
};
const products = await readFile2("data/produtos-para-investir.json");
const investProducts = mapToBestInvestProducts(JSON.parse(products));

console.log("CDB DI");
const cdbDi = filterInvestProducts(investProducts, {
  tipo: "CDB",
  indexador: "DI",
  taxaEmPorcentagem: 120,
  grauRisco: 5,
});
console.log(cdbDi);

console.log("CDB IPCA");
const cdbIpca = filterInvestProducts(investProducts, {
  tipo: "CDB",
  indexador: "IPCA",
  taxaEmPorcentagem: 5,
  grauRisco: 5,
});
console.log(cdbIpca);

console.log("LCI DI");
const lciDi = filterInvestProducts(investProducts, {
  tipo: "LCI",
  indexador: "DI",
  taxaEmPorcentagem: 100,
  grauRisco: 5,
});
console.log(lciDi);

console.log("LCI IPCA");
const lciIpca = filterInvestProducts(investProducts, {
  tipo: "LCI",
  indexador: "IPCA",
  taxaEmPorcentagem: 5,
  grauRisco: 5,
});
console.log(lciIpca);
