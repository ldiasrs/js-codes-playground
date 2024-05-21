import fetch from "node-fetch";
import moment from "moment";

const FORMAT_DATE_API = "MM-DD-YYYY";
/*
 * Outra fonte: `https://economia.awesomeapi.com.br/json/daily/${moeda}?start_date=${starData}&end_date=${endDate}`;
 */
export const consultDolarMonth = async (moeda, starData, endDate) => {
  debug("consultDolarMonth:", { moeda, starData, endDate });
  const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?@dataInicial='${starData}'&@dataFinalCotacao='${endDate}'&$top=100&$format=json&$select=cotacaoCompra,cotacaoVenda`;
  const response = await fetch(url, { method: "GET" });
  const data = await response.json();
  return data;
};

const debug = (message, data) => {
  if (!process.env.DEBUG) return;
  console.log("debug:" + message, data ? JSON.stringify(data) : "");
};

const print = (message) => {
  console.log(message);
};

const getLowestCotacaoCompra = (cotacoes) => {
  return cotacoes.value.reduce((acc, curr) =>
    acc.cotacaoCompra < curr.cotacaoCompra ? acc : curr
  );
};

const getHighestCotacaoCompra = (cotacoes) => {
  return cotacoes.value.reduce((acc, curr) =>
    acc.cotacaoCompra > curr.cotacaoCompra ? acc : curr
  );
};

const printHelp = () => {
  console.log("Usage: npm run dollar [mode]");
  console.log("-mode:[dia/day, mesAnterior/lastMonth, mesAtual/thisMonth]");
};

const getRangeForMode = (mode) => {
  const aliases = {
    dia: "day",
    mesAnterior: "lastMonth",
    mesPassado: "lastMonth",
    mesAtual: "thisMonth",
  };
  const rangeMap = {
    day: () => ({ startDate: moment(), endDate: moment() }),
    lastMonth: () => ({
      startDate: moment().subtract(1, "months").startOf("month"),
      endDate: moment().subtract(1, "months").endOf("month"),
    }),
    thisMonth: () => ({
      startDate: moment().startOf("month"),
      endDate: moment().endOf("month"),
    }),
  };

  const rangeFn = rangeMap[aliases[mode] ?? mode];
  if (!rangeFn) {
    throw new Error(`Unsupported mode: ${mode}`);
  }
  return rangeFn();
};

const main = async () => {
  try {
    const mode = process.argv[2] ?? "lastMonth";
    const { startDate, endDate } = getRangeForMode(mode);

    const cotacoes = await consultDolarMonth(
      "USD-BRL",
      startDate.format(FORMAT_DATE_API),
      endDate.format(FORMAT_DATE_API)
    );
    const menorCotacao = getLowestCotacaoCompra(cotacoes);
    const maiorCotacao = getHighestCotacaoCompra(cotacoes);
    print("Mode: " + mode);
    print(
      `Periodo: ${startDate.format("YYYY-MM-DD")} - ${endDate.format(
        "YYYY-MM-DD"
      )} `
    );
    print("Menor cotacao: " + JSON.stringify(menorCotacao.cotacaoCompra));
    print("Maior cotacao: " + JSON.stringify(maiorCotacao.cotacaoCompra));
  } catch (error) {
    printHelp();
    print("Error: " + error.message);
  }
};

await main();
