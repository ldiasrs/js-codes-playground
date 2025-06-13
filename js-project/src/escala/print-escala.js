export const prinfEscalasPorDia = (escalas) => {
  const localPorDia = [];
  escalas.forEach((escalaDia) => {
    escalaDia.forEach((escala) => {
      const chave = escala.local + escala.data;
      if (!localPorDia[chave]) {
        localPorDia[chave] = {
          local: escala.local,
          data: escala.data,
          profissionais: [],
        };
      }
      localPorDia[chave].profissionais.push({
        nome: escala.profissional,
        atuacao: escala.atuacao,
        tags: escala.tags,
      });
    });
  });
  Object.values(localPorDia).forEach((escalaDia) => {
    console.log("-------------------------------------------------");
    console.log(`${escalaDia.local}: dia: ${escalaDia.data}`);
    console.log("-------------------------------------------------");
    escalaDia.profissionais.forEach((profissional) => {
      console.log(
        `${profissional.nome} - ${profissional.atuacao} - ${profissional.tags}`
      );
    });
  });
};
