import { montarEscalaDoDia } from "./montar-escala.js";

describe("montarEscalaDoDia", () => {
  it("deve montar escala com cargo e tag", () => {
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

  it("deve utilizar mesma pessoa com tag quando já esta na escala", () => {
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

  it("deve utilizar mesma pessoa com multiplas tag quando já esta na escala", () => {
    const locaisDeEscala = [
      {
        local: "Vac Gasômetro",
        necessidades: [
          { tag: "MOTORISTA", quantidade: 1 },
          { tag: "APOIO", quantidade: 1 },
          { cargo: "Medico", quantidade: 1 },
        ],
      },
    ];
    const profissionais = [
      {
        nome: "João",
        cargo: "Medico",
        tags: ["MOTORISTA", "APOIO"],
      },
      {
        nome: "Maria",
        cargo: "Enfermeira",
        tags: ["MOTORISTA", "APOIO"],
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
        tags: ["MOTORISTA", "APOIO"],
      },
    ]);
  });
});
