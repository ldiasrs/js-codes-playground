import config from "../../config/global-config.prod.json" assert { type: "json" };
import moment from "moment";
import { readFileSync } from "fs";
import { writeFile } from "../common/commons.js";
import { debug } from "../common/commons.js";

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
    .filter((invest) => invest.grauRisco <= filterOptions.grauRisco)
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
const products = await readFileSync(
  config.find_best_investment.input_data_file
);
const investProducts = mapToBestInvestProducts(JSON.parse(products));

const grauRisco = 3;
const cdbDi = filterInvestProducts(investProducts, {
  tipo: "CDB",
  indexador: "DI",
  taxaEmPorcentagem: 120,
  grauRisco,
});

const cdbIpca = filterInvestProducts(investProducts, {
  tipo: "CDB",
  indexador: "IPCA",
  taxaEmPorcentagem: 5,
  grauRisco,
});

const cdbPre = filterInvestProducts(investProducts, {
  tipo: "CDB",
  indexador: "PRE",
  taxaEmPorcentagem: 11,
  grauRisco,
});

const lciDi = filterInvestProducts(investProducts, {
  tipo: "LCI",
  indexador: "DI",
  taxaEmPorcentagem: 100,
  grauRisco,
});

const lciIpca = filterInvestProducts(investProducts, {
  tipo: "LCI",
  indexador: "IPCA",
  taxaEmPorcentagem: 5,
  grauRisco,
});
const timeFileIdName = moment().format("YYYYMMDDHHmmss");
const allProducts = [cdbPre, cdbDi, cdbIpca, lciDi, lciIpca];
const outputFile = `output/best-investment-products.${timeFileIdName}.json`;
await writeFile(outputFile, JSON.stringify(allProducts, null, 2));
debug("File created with the best investment products on: " + outputFile);
