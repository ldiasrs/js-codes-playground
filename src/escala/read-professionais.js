import { readFileSync } from "fs";
import Papa from "papaparse";

export const readProfissionais = () => {
  const csvFile = readFileSync("data/escala/profissionais.csv", "utf8");
  const results = Papa.parse(csvFile, { delimiter: "	" });
  return results.data
    .slice(1)
    .map((row) => ({
      nome: row[0],
      cargo: row[1],
      tags: row[2] ? row[2].split(",") : [],
      telefone: "",
      endereco: "",
      localExclusivo: "NÃO",
    }))
    .filter((profissional) => !profissional.tags.includes("BLOQUEADO"));
};
