//https://economia.awesomeapi.com.br/json/daily/${moeda}?start_date=20180901&end_date=20180930
import fetch from "node-fetch";
import moment from "moment";

const formatPattern = "MM-DD-YYYY";
const debugFlag = false;

export const consultDolarMonth = async (moeda, starData, endDate) => {
  debug("consultDolarMonth:", { moeda, starData, endDate });
  const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?@dataInicial='${starData}'&@dataFinalCotacao='${endDate}'&$top=100&$format=json&$select=cotacaoCompra,cotacaoVenda`;
  //const url = `https://economia.awesomeapi.com.br/json/daily/${moeda}?start_date=${starData}&end_date=${endDate}`;
  const response = await fetch(url, { method: "GET" });
  const data = await response.json();
  return data;
};

const debug = (message, data) => {
  if (!debugFlag) return;
  console.log(message, data ? JSON.stringify(data) : "");
};

const print = (message) => {
  console.log(message);
};

const getStartDay = () => {
  const date = moment().subtract(1, "months").startOf("month");
  return {
    date,
    formatted: date.format(formatPattern),
  };
};

const getEndDay = () => {
  const date = moment().subtract(1, "months").endOf("month");
  return {
    date,
    formatted: date.format(formatPattern),
  };
};

const getLowestCotacaoCompra = (cotacoes) => {
  return cotacoes.value.reduce((acc, curr) =>
    acc.cotacaoCompra < curr.cotacaoCompra ? acc : curr
  );
};
const startDate = getStartDay();
const endDate = getEndDay();

const cotacoes = await consultDolarMonth(
  "USD-BRL",
  startDate.formatted,
  endDate.formatted
);
const menorCotacao = getLowestCotacaoCompra(cotacoes);
print(
  `Periodo: ${startDate.date.format("YYYY-MM-DD")} - ${endDate.date.format(
    "YYYY-MM-DD"
  )} `
);
print("Menor cotacao: " + JSON.stringify(menorCotacao.cotacaoCompra));
