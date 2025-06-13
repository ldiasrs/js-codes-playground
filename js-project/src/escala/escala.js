import { montarEscalaDoDia } from "./montar-escala.js";
import { readProfissionais } from "./read-professionais.js";
import { prinfEscalasPorDia } from "./print-escala.js";

const locaisDeEscala = [
  //   {
  //     local: "CT",
  //     necessidades: [
  //       { cargoOuTag: "Médico", quantidade: 2 },
  //       { cargoOuTag: "Enfermeira", quantidade: 2 },
  //       { cargoOuTag: "Técnico de enfermagem", quantidade: 4 },
  //     ],
  //   },
  {
    local: "Vac Gasômetro",
    necessidades: [
      { tag: "MOTORISTA", quantidade: 1 },
      { tag: "APOIO", quantidade: 1 },
      { cargo: "Enfermeiro", quantidade: 2 },
      { cargo: "Técnico de enfermagem", quantidade: 1 },
    ],
  },
  {
    local: "Vac Benjamin",
    necessidades: [
      { tag: "MOTORISTA", quantidade: 1 },
      { tag: "APOIO", quantidade: 1 },
      { cargo: "Enfermeiro", quantidade: 2 },
      { cargo: "Técnico de enfermagem", quantidade: 1 },
    ],
  },
];

const dias = ["15/05/2024", "16/05/2024", "17/05/2024"];
const profissionais = readProfissionais();
const escalas = dias.map((dia) =>
  montarEscalaDoDia(dia, locaisDeEscala, profissionais)
);
prinfEscalasPorDia(escalas);
