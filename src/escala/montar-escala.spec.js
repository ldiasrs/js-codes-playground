import { montarEscalaDoDia } from "./montar-escala.js";
import { expect, test } from "vitest";
test("should get escala with cargo and tag", () => {
  const locaisDeEscala = [
    {
      local: "Vac Gasômetro",
      necessidades: [
        { tag: "MOTORISTA", quantidade: 1 },
        { cargo: "Medico", quantidade: 1 },
      ],
    },
  ];
  const profissionais = [
    {
      nome: "João",
      cargo: "Medico",
      tags: [],
    },
    {
      nome: "Maria",
      cargo: "Enfermeira",
      tags: ["MOTORISTA"],
    },
    {
      nome: "José",
      cargo: "Enfermeira",
      tags: [],
    },
  ];
  const escalas = montarEscalaDoDia(
    "15/05/2024",
    locaisDeEscala,
    profissionais
  );
  console.log(escalas);
  expect(escalas).toEqual([
    {
      atuacao: "Medico",
      cargo: "Medico",
      data: "15/05/2024",
      local: "Vac Gasômetro",
      profissional: "João",
      tags: [],
    },
    {
      atuacao: "MOTORISTA",
      cargo: "Enfermeira",
      data: "15/05/2024",
      local: "Vac Gasômetro",
      profissional: "Maria",
      tags: ["MOTORISTA"],
    },
  ]);
});

test("should get escala with cargo and use tag", () => {
  const locaisDeEscala = [
    {
      local: "Vac Gasômetro",
      necessidades: [
        { tag: "MOTORISTA", quantidade: 1 },
        { cargo: "Medico", quantidade: 1 },
      ],
    },
  ];
  const profissionais = [
    {
      nome: "João",
      cargo: "Medico",
      tags: ["MOTORISTA"],
    },
    {
      nome: "Maria",
      cargo: "Enfermeira",
      tags: ["MOTORISTA"],
    },
    {
      nome: "José",
      cargo: "Enfermeira",
      tags: [],
    },
  ];
  const escalas = montarEscalaDoDia(
    "15/05/2024",
    locaisDeEscala,
    profissionais
  );
  console.log(escalas);
  expect(escalas).toEqual([
    {
      atuacao: "Medico",
      cargo: "Medico",
      data: "15/05/2024",
      local: "Vac Gasômetro",
      profissional: "João",
      tags: ["MOTORISTA"],
    },
  ]);
});
