"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const fs_1 = require("fs");
const commons_1 = require("../common/commons");
const path_1 = __importDefault(require("path"));
// Import config using absolute path
const configPath = path_1.default.join(__dirname, "../../../config/global-config.prod.json");
const config = JSON.parse((0, fs_1.readFileSync)(configPath, "utf8"));
const extractTaxaFromText = (text) => {
    const taxa = text.match(/(\d+,?\d*)%/);
    return taxa && taxa[1] ? Number(taxa[1].replace(",", ".")) : 0;
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
    (0, commons_1.debug)("Filtering investment products", filterOptions);
    const investProductsFiltered = investProducts
        .filter((invest) => invest.tipo === filterOptions.tipo)
        .filter((invest) => invest.indexador === filterOptions.indexador)
        .filter((invest) => invest.taxaEmPorcentagem >= filterOptions.taxaEmPorcentagem)
        .filter((invest) => invest.grauRisco <= filterOptions.grauRisco)
        .sort((a, b) => (0, moment_1.default)(a.resgate, "DD/MM/YYYY").valueOf() -
        (0, moment_1.default)(b.resgate, "DD/MM/YYYY").valueOf())
        .sort((a, b) => (a.grauRisco < b.grauRisco ? -1 : 1))
        .sort((a, b) => b.taxaEmPorcentagem - a.taxaEmPorcentagem);
    (0, commons_1.debug)("Investment products filtered: " + investProductsFiltered.length);
    return {
        filterName: `${filterOptions.tipo} ${filterOptions.indexador}`,
        investProducts: investProductsFiltered,
        comentario: filterOptions.comentario || undefined,
    };
};
const main = async () => {
    (0, commons_1.debug)("Reading file: " + config.find_best_investment.input_data_file);
    const products = (0, fs_1.readFileSync)(config.find_best_investment.input_data_file, "utf8");
    (0, commons_1.debug)("Parsing products size: " + products?.length);
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
        comentario: "Os ultimos investimentos em IPCA tiveram resultado muito ruim nao recomendo",
        grauRisco,
    });
    const timeFileIdName = (0, moment_1.default)().format("YYYYMMDDHHmmss");
    const allProducts = [cdbPre, cdbDi, cdbIpca, lciDi, lciIpca];
    const outputFile = `output/best-investment-products.${timeFileIdName}.json`;
    await (0, commons_1.writeFile)(outputFile, JSON.stringify(allProducts, null, 2));
    (0, commons_1.debug)("File created with the best investment products on: " + outputFile);
};
main();
//# sourceMappingURL=find-best-product.js.map