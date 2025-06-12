import fs from "fs";
import path from "path";
import csv from "csv-parser";

// Função para converter o valor do campo "Valor" para número.
// Remove o "R$" e substitui a vírgula por ponto.
function parseValor(valorStr) {
  return parseFloat(valorStr.replace("R$", "").trim().replace(",", "."));
}

// Função que processa um arquivo CSV e retorna uma Promise com os dados agrupados.
function processCSV(filePath) {
  return new Promise((resolve, reject) => {
    const dataByCategory = {};
    fs.createReadStream(filePath)
      .pipe(
        csv({
          separator: ",",
          // Remove BOM e espaços em branco dos cabeçalhos
          mapHeaders: ({ header }) =>
            header.replaceAll('"', "").replace("\ufeff", "").trim(),
        })
      )
      .on("data", (row) => {
        // Redefine a categoria baseado no nome do lançamento:
        let categoria = row["Categoria"];
        const lancamento = row["Lançamento"];
        if (lancamento && lancamento.toUpperCase().includes("ABAST SHELL")) {
          categoria = "TRANSPORTE";
        }
        // Atualiza o campo "Categoria" no objeto row (opcional)
        row["Categoria"] = categoria;

        const valor = parseValor(row["Valor"]);

        if (!dataByCategory[categoria]) {
          dataByCategory[categoria] = { total: 0, entries: [] };
        }
        dataByCategory[categoria].total += valor;
        // Armazena a linha com o valor numérico para facilitar a ordenação.
        dataByCategory[categoria].entries.push({
          ...row,
          numericValue: valor,
        });
      })
      .on("end", () => {
        // Para cada categoria, ordena as entradas de forma decrescente e seleciona as 5 com maior valor.
        for (const categoria in dataByCategory) {
          dataByCategory[categoria].entries.sort(
            (a, b) => b.numericValue - a.numericValue
          );
          dataByCategory[categoria].top5 = dataByCategory[
            categoria
          ].entries.slice(0, 5);
        }
        resolve({ filePath, dataByCategory });
      })
      .on("error", (error) => reject(error));
  });
}

// Caminho da pasta que contém os arquivos CSV.
const folderPath = "data/faturas"; // Substitua pelo caminho da sua pasta

// Lê o diretório e filtra apenas os arquivos CSV.
fs.readdir(folderPath, (err, files) => {
  if (err) {
    return console.error("Erro ao ler o diretório:", err);
  }

  const csvFiles = files
    .filter((file) => path.extname(file).toLowerCase() === ".csv")
    .map((file) => path.join(folderPath, file));

  if (csvFiles.length === 0) {
    return console.log("Nenhum arquivo CSV encontrado na pasta.");
  }

  // Processa todos os arquivos CSV encontrados na pasta.
  Promise.all(csvFiles.map(processCSV))
    .then((results) => {
      // Exibe os relatórios individuais para cada arquivo.
      results.forEach((result) => {
        console.log(`\nRelatório para o arquivo: ${result.filePath}`);
        // Ordena as categorias por total gasto, do maior para o menor.
        const sortedCategories = Object.entries(result.dataByCategory).sort(
          ([, a], [, b]) => b.total - a.total
        );
        const filtroCategorias = process.env.FILTRO_CATEGORIA;
        // ?? [
        //   "SUPERMERCADO",
        //   "VESTUARIO",
        //   "COMPRAS",
        //   "ENTRETENIMENTO",
        //   "CULTURA",
        //   "CONSTRUCAO",
        //   "SERVICOS",
        // ];
        sortedCategories
          .filter(([categoria]) =>
            filtroCategorias && filtroCategorias.length > 0
              ? filtroCategorias.includes(categoria)
              : true
          )
          .forEach(([categoria, info]) => {
            console.log(`\nCategoria: ${categoria}`);
            console.log(`Total gasto: R$ ${info.total.toFixed(2)}`);
            console.log("Top 5 entradas com maior valor:");
            info.top5.forEach((entry) => {
              console.log(
                `  Data: ${entry.Data} | Lançamento: ${
                  entry["Lançamento"]
                } | Valor: R$ ${entry.numericValue.toFixed(2)}`
              );
            });
          });
        console.log("\n============================");
      });

      // Agrega os totais de cada categoria considerando TODOS os arquivos.
      const numFiles = results.length;
      const overallData = {};
      results.forEach((result) => {
        const dataByCategory = result.dataByCategory;
        // Para cada categoria presente no arquivo, acumula o total.
        for (const categoria in dataByCategory) {
          if (!overallData[categoria]) {
            overallData[categoria] = 0;
          }
          overallData[categoria] += dataByCategory[categoria].total;
        }
      });

      // Calcula a média para cada categoria dividindo pelo número de arquivos processados
      // e ordena em ordem decrescente da média.
      const averages = Object.entries(overallData)
        .map(([categoria, total]) => ({
          categoria,
          average: total / numFiles,
        }))
        .sort((a, b) => b.average - a.average);

      console.log(
        "\nMédia dos valores das categorias (todos os arquivos, em ordem decrescente):"
      );
      averages.forEach(({ categoria, average }) => {
        console.log(
          `  Categoria: ${categoria} | Média: R$ ${average.toFixed(2)}`
        );
      });
    })
    .catch((err) => console.error("Erro ao processar CSV:", err));
});
