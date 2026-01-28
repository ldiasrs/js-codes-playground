import fs from "fs";
import path from "path";
import csv from "csv-parser";

interface CategoriaPorTextoRule {
  categoria: string;
  textos: string[];
}

interface DespesasConfig {
  folderPath: string;
  csvSeparator: string;
  topEntriesPerCategory: number;
  categoriaPorTexto: CategoriaPorTextoRule[];
  mapeamentoCategoria: Record<string, string>;
}

const CONFIG: DespesasConfig = {
  folderPath: "data/faturas",
  csvSeparator: ",",
  topEntriesPerCategory: 5,
  categoriaPorTexto: [
    {
      categoria: "COMPRAS",
      textos: [
        "LOJATABA",
        "MORRODESAUDADE2",
      ],
    },
    {
      categoria: "COMPRAS-MERCADOLIVRE",
      textos: [
        "MERCADOLIVRE",
        "MERCADOPAGO",
      ],
    },
    {
      categoria: "COMPRAS-DECATHLON",
      textos: [
        "DECATHLON",
      ],
    },
    {
      categoria: "COMPRAS-AMAZON",
      textos: [
        "AMAZON MARKETPLACE",
        "AMAZONMKTPLC",
        "AMAZON BR",
      ],
    },
    {
      categoria: "COMPRAS-STEAM",
      textos: [
        "STEAM"
      ],
    },
    {
      categoria: "COMPRAS-CENTAURO",
      textos: [
        "CENTAURO"
      ],
    },
    {
      categoria: "COMPRAS-SHOPPING-INTER",
      textos: [
        "SHOPPING INTER",
      ],
    },
    {
      categoria: "CARRO",
      textos: [
        "GIFT CARD",
        "GIFT CARD PARCELAMENTO",
        "ABAST SHELL",
        "COMBUSTIV",
        "SPONCHIADO",
        "abastec",
        "ABASTEC",
        "POSTO",
        "SEGUROS",
        "ABAST",
        "BUFFON",
        "REDE FARROUPILHA"
      ],
    },
    { categoria: "SUPERMERCADO", textos: ["CESTTO", "RISSUL"] },
    { categoria: "VIAGEM", textos: ["Booking"] },
    { categoria: "WINE", textos: ["WINE"] },
    { categoria: "REFEICOES", textos: ["Restaurante", "ERMINDOHENRIQUEGE", "Dm2CervejariaLtda", "COMIDA", "EskimoLojaDe"] },
    { categoria: "INTERNET", textos: ["Starlink", "CLARO", "STARLINK", "UNIFIQUE"] },
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

function parseValor(valorStr: string | undefined): number {
  try {
    if (!valorStr) {
      return 0;
    }
    const parsed = parseFloat(
      valorStr.replace("R$", "").trim().replace(",", ".")
    );
    return Number.isNaN(parsed) ? 0 : parsed;
  } catch {
    return 0;
  }
}

function normalizarTexto(texto: string | undefined): string {
  return texto ? texto.toUpperCase() : "";
}

function mapearCategoriaPorTexto(lancamento: string): string | null {
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

function mapearCategoria(categoriaOriginal: string | undefined, lancamento: string): string {
  const categoriaPorTexto = mapearCategoriaPorTexto(lancamento);
  const categoriaInicial = categoriaPorTexto ?? categoriaOriginal;
  if (!categoriaInicial) {
    return "OUTROS";
  }
  const categoriaNormalizada = categoriaInicial.trim().toUpperCase();
  return CONFIG.mapeamentoCategoria[categoriaNormalizada] ?? categoriaInicial;
}

function prepararHeader({ header }: { header: string }): string {
  return header.replaceAll('"', "").replace("\ufeff", "").trim();
}

interface CsvRow {
  [key: string]: string;
}

interface CategoryEntry extends Record<string, string | number> {
  numericValue: number;
}

interface CategoryInfo {
  total: number;
  entries: CategoryEntry[];
  top5: CategoryEntry[];
}

interface ProcessCsvResult {
  filePath: string;
  dataByCategory: Record<string, CategoryInfo>;
}

function ordenarESelecionarTop(entries: CategoryEntry[]): CategoryEntry[] {
  return entries
    .sort((a, b) => b.numericValue - a.numericValue)
    .slice(0, CONFIG.topEntriesPerCategory);
}

function processCSV(filePath: string): Promise<ProcessCsvResult> {
  return new Promise((resolve, reject) => {
    const dataByCategory: Record<string, Omit<CategoryInfo, "top5"> & { top5?: CategoryEntry[] }> = {};
    fs.createReadStream(filePath)
      .pipe(
        csv({
          separator: CONFIG.csvSeparator,
          mapHeaders: prepararHeader,
        })
      )
      .on("data", (row: CsvRow) => {
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
        resolve({ filePath, dataByCategory: dataByCategory as Record<string, CategoryInfo> });
      })
      .on("error", (error: Error) => reject(error));
  });
}

function lerCsvsDoDiretorio(folderPath: string): Promise<string[]> {
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

function filtrarCategorias(
  sortedCategories: [string, CategoryInfo][]
): [string, CategoryInfo][] {
  const filtroCategorias = process.env.FILTRO_CATEGORIA;
  if (!filtroCategorias || filtroCategorias.length === 0) {
    return sortedCategories;
  }
  return sortedCategories.filter(([categoria]) =>
    filtroCategorias.includes(categoria)
  );
}

function imprimirRelatorioIndividual(result: ProcessCsvResult): void {
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

interface CategoryAverage {
  categoria: string;
  average: number;
}

function calcularMedias(results: ProcessCsvResult[]): CategoryAverage[] {
  const numFiles = results.length;
  const overallData: Record<string, number> = {};
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

function imprimirMedias(averages: CategoryAverage[]): void {
  console.log(
    "\nMédia dos valores das categorias (todos os arquivos, em ordem decrescente):"
  );
  averages.forEach(({ categoria, average }) => {
    console.log(`  Categoria: ${categoria} | Média: R$ ${average.toFixed(2)}`);
  });
}

function executar(): void {
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
    .catch((err: unknown) => console.error("Erro ao processar CSV:", err));
}

executar();
