import moment from "moment";
import { readFileSync } from "fs";
import { debug, writeFile } from "../common/commons";
import path from "path";

// Import config using absolute path
const configPath = path.join(__dirname, "../../../config/global-config.prod.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));

interface InvestProduct {
  taxa: string;
  tipo: {
    descricao: string;
  };
  indexador: {
    descricao: string;
  };
  aplicacaoMinima: number;
  resgate: string;
  grauRisco: number;
  garantidoFgc: boolean;
  grossUp: boolean;
  nome: string;
}

interface BestInvestProduct {
  taxaEmPorcentagem: number;
  tipo: string;
  indexador: string;
  aplicacaoMinima: number;
  resgate: string;
  grauRisco: number;
  garantidoFgc: boolean;
  grossUp: boolean;
  nome: string;
}

interface FilterOptions {
  tipo: string;
  indexador: string;
  taxaEmPorcentagem: number;
  grauRisco: number;
  comentario?: string;
}

interface FilteredResult {
  filterName: string;
  investProducts: BestInvestProduct[];
  comentario?: string;
}

const extractTaxaFromText = (text: string): number => {
  const taxa = text.match(/(\d+,?\d*)%/);
  return taxa && taxa[1] ? Number(taxa[1].replace(",", ".")) : 0;
};

const mapToBestInvestProducts = (
  products: InvestProduct[]
): BestInvestProduct[] => {
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

const filterInvestProducts = (
  investProducts: BestInvestProduct[],
  filterOptions: FilterOptions
): FilteredResult => {
  debug("Filtering investment products", filterOptions);
  const investProductsFiltered = investProducts
    .filter((invest) => invest.tipo === filterOptions.tipo)
    .filter((invest) => invest.indexador === filterOptions.indexador)
    .filter(
      (invest) => invest.taxaEmPorcentagem >= filterOptions.taxaEmPorcentagem
    )
    .filter((invest) => invest.grauRisco <= filterOptions.grauRisco)
    .sort(
      (a, b) =>
        moment(a.resgate, "DD/MM/YYYY").valueOf() -
        moment(b.resgate, "DD/MM/YYYY").valueOf()
    )
    .sort((a, b) => (a.grauRisco < b.grauRisco ? -1 : 1))
    .sort((a, b) => b.taxaEmPorcentagem - a.taxaEmPorcentagem);
  debug("Investment products filtered: " + investProductsFiltered.length);
  return {
    filterName: `${filterOptions.tipo} ${filterOptions.indexador}`,
    investProducts: investProductsFiltered,
    comentario: filterOptions.comentario || undefined,
  };
};

const main = async () => {
  debug("Reading file: " + config.find_best_investment.input_data_file);
  const products = readFileSync(
    config.find_best_investment.input_data_file,
    "utf8"
  );

  debug("Parsing products size: " + products?.length);
  const investProducts = mapToBestInvestProducts(JSON.parse(products));

  const grauRisco = 3;
  const cdbDi = filterInvestProducts(investProducts, {
    tipo: "CDB",
    indexador: "DI",
    taxaEmPorcentagem: 110,
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

  //Os ultimos investimentos em IPCA tiveram resultado muito ruim nao recomendo
  const cdbIpca = filterInvestProducts(investProducts, {
    tipo: "CDB",
    indexador: "IPCA",
    taxaEmPorcentagem: 12,
    comentario:
      "Os ultimos investimentos em IPCA tiveram resultado muito ruim nao recomendo",
    grauRisco,
  });

  const timeFileIdName = moment().format("YYYYMMDDHHmmss");
  const allProducts = [cdbPre, cdbDi, cdbIpca, lciDi, lciIpca];
  const outputFile = `output/best-investment-products.${timeFileIdName}.json`;
  await writeFile(outputFile, JSON.stringify(allProducts, null, 2));
  debug("File created with the best investment products on: " + outputFile);
};

main();
