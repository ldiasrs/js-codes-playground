import fs from "fs";
import path from "path";
import csv from "csv-parser";

const CONFIG = {
  folderPath: "data/faturas",
  csvSeparator: ",",
  topEntriesPerCategory: 5,
  categoriaPorTexto: [
    {
      categoria: "COMPRAS",
      textos: [
        "SHOPPING INTER",
        "MERCADOLIVRE",
        "LOJATABA",
        "CENTAURO",
        "CENTAURO",
        "AMAZON MARKETPLACE",
        "AMAZON BR",
        "GIFT CARD",
        "MORRODESAUDADE2",
      ],
    },
    { categoria: "CARRO", 
      textos: [
        "ABAST SHELL",
         "COMBUSTIV",
        "SPONCHIADO",
        "abastec",
        "ABASTEC",
        "POSTO",
        "SEGUROS",
        "ABAST",
        "BUFFON",
        "REDE FARROUPILHA"] 
    },
    { categoria: "SUPERMERCADO", textos: ["CESTTO"] },
    { categoria: "REFEICOES", textos: ["ERMINDOHENRIQUEGE", "Dm2CervejariaLtda"] },
    { categoria: "INTERNET", textos: ["Starlink", "CLARO", "STARLINK"] },
  ],
  mapeamentoCategoria: {
    VESTUARIO: "COMPRAS",
    HOSPEDAGEM: "VIAGEM",
    ENTRETENIMENTO: "COMPRAS",
    CONSTRUCAO: "COMPRAS",
    CULTURA: "COMPRAS",
    SERVICOS: "REFEICOES",
    BARES: "REFEICOES",
    RESTAURANTES: "REFEICOES",
    ENSINO: "COMPRAS",
    LIVRARIAS: "COMPRAS",
    SAUDE: "DROGARIA",
    ESPORTES: "COMPRAS",
    PAGAMENTOS: "COMPRAS"
  },
};

function parseValor(valorStr) {
  try {
    if (!valorStr) {
      return 0;
    }
    const parsed = parseFloat(
      valorStr.replace("R$", "").trim().replace(",", ".")
    );
    return Number.isNaN(parsed) ? 0 : parsed;
  } catch (error) {
    return 0;
  }
}

function normalizarTexto(texto) {
  return texto ? texto.toUpperCase() : "";
}

function mapearCategoriaPorTexto(lancamento) {
  const lancamentoUpper = normalizarTexto(lancamento);
  for (const regra of CONFIG.categoriaPorTexto) {
    if (
      regra.textos.some((texto) =>
        lancamentoUpper.includes(normalizarTexto(texto))
      )
    ) {
      return regra.categoria;
    }
  }
  return null;
}

function mapearCategoria(categoriaOriginal, lancamento) {
  const categoriaPorTexto = mapearCategoriaPorTexto(lancamento);
  const categoriaInicial = categoriaPorTexto ?? categoriaOriginal;
  if (!categoriaInicial) {
    return "OUTROS";
  }
  const categoriaNormalizada = categoriaInicial.trim().toUpperCase();
  return CONFIG.mapeamentoCategoria[categoriaNormalizada] ?? categoriaInicial;
}

function prepararHeader({ header }) {
  return header.replaceAll('"', "").replace("\ufeff", "").trim();
}

function ordenarESelecionarTop(entries) {
  return entries
    .sort((a, b) => b.numericValue - a.numericValue)
    .slice(0, CONFIG.topEntriesPerCategory);
}

function processCSV(filePath) {
  return new Promise((resolve, reject) => {
    const dataByCategory = {};
    fs.createReadStream(filePath)
      .pipe(
        csv({
          separator: CONFIG.csvSeparator,
          mapHeaders: prepararHeader,
        })
      )
      .on("data", (row) => {
        const categoria = mapearCategoria(row["Categoria"], row["Lançamento"]);
        row["Categoria"] = categoria;

        const valor = parseValor(row["Valor"]);
        if (!dataByCategory[categoria]) {
          dataByCategory[categoria] = { total: 0, entries: [] };
        }
        dataByCategory[categoria].total += valor;
        dataByCategory[categoria].entries.push({
          ...row,
          numericValue: valor,
        });
      })
      .on("end", () => {
        for (const categoria in dataByCategory) {
          dataByCategory[categoria].top5 = ordenarESelecionarTop(
            dataByCategory[categoria].entries
          );
        }
        resolve({ filePath, dataByCategory });
      })
      .on("error", (error) => reject(error));
  });
}

function lerCsvsDoDiretorio(folderPath) {
  return new Promise((resolve, reject) => {
    fs.readdir(folderPath, (err, files) => {
      if (err) {
        reject(err);
        return;
      }
      const csvFiles = files
        .filter((file) => path.extname(file).toLowerCase() === ".csv")
        .map((file) => path.join(folderPath, file));
      resolve(csvFiles);
    });
  });
}

function filtrarCategorias(sortedCategories) {
  const filtroCategorias = process.env.FILTRO_CATEGORIA;
  if (!filtroCategorias || filtroCategorias.length === 0) {
    return sortedCategories;
  }
  return sortedCategories.filter(([categoria]) =>
    filtroCategorias.includes(categoria)
  );
}

function imprimirRelatorioIndividual(result) {
  console.log(`\nRelatório para o arquivo: ${result.filePath}`);
  const sortedCategories = Object.entries(result.dataByCategory).sort(
    ([, a], [, b]) => b.total - a.total
  );
  filtrarCategorias(sortedCategories).forEach(([categoria, info]) => {
    console.log(`\nCategoria: ${categoria}`);
    console.log(`Total gasto: R$ ${info.total.toFixed(2)}`);
    console.log("Top 5 entradas com maior valor:");
    info.top5.forEach((entry) => {
      console.log(
        `  Data: ${entry.Data} | Lançamento: ${entry["Lançamento"]} | Valor: R$ ${entry.numericValue.toFixed(2)}`
      );
    });
  });
  console.log("\n============================");
}

function calcularMedias(results) {
  const numFiles = results.length;
  const overallData = {};
  results.forEach((result) => {
    const dataByCategory = result.dataByCategory;
    for (const categoria in dataByCategory) {
      if (!overallData[categoria]) {
        overallData[categoria] = 0;
      }
      overallData[categoria] += dataByCategory[categoria].total;
    }
  });
  return Object.entries(overallData)
    .map(([categoria, total]) => ({
      categoria,
      average: total / numFiles,
    }))
    .sort((a, b) => b.average - a.average);
}

function imprimirMedias(averages) {
  console.log(
    "\nMédia dos valores das categorias (todos os arquivos, em ordem decrescente):"
  );
  averages.forEach(({ categoria, average }) => {
    console.log(`  Categoria: ${categoria} | Média: R$ ${average.toFixed(2)}`);
  });
}

function executar() {
  lerCsvsDoDiretorio(CONFIG.folderPath)
    .then((csvFiles) => {
      if (csvFiles.length === 0) {
        console.log("Nenhum arquivo CSV encontrado na pasta.");
        return;
      }
      return Promise.all(csvFiles.map(processCSV)).then((results) => {
        results.forEach(imprimirRelatorioIndividual);
        imprimirMedias(calcularMedias(results));
      });
    })
    .catch((err) => console.error("Erro ao processar CSV:", err));
}

executar();
