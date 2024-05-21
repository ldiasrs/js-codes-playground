import { debug } from "../commons.js";
const createMappingProfissionaisPorCargo = (profissionais) => {
  const stack = [];
  profissionais.forEach((profissional) => {
    if (!stack[profissional.cargo]) {
      stack[profissional.cargo] = [];
    }
    stack[profissional.cargo].push(profissional);
  });
  profissionais.forEach((profissional) => {
    if (profissional?.tags?.length > 0) {
      profissional.tags.forEach((tag) => {
        if (!stack[tag]) {
          stack[tag] = [];
        }
        stack[tag].push(profissional);
      });
    }
  });
  return stack;
};

const mapEscala = (profissional, atuacao, local, data) => {
  return {
    profissional: profissional.nome,
    data,
    cargo: profissional.cargo,
    tags: profissional.tags,
    atuacao,
    local,
  };
};

export const montarEscalaDoDia = (dia, locaisDeEscala, profissionais) => {
  const profissionaisMap = createMappingProfissionaisPorCargo(profissionais);
  const escalas = [];
  debug("dia", dia);
  locaisDeEscala.forEach((localEscala) => {
    debug(
      "----------------------------------------------------------------------"
    );
    debug("localEscala", localEscala);
    debug(
      "----------------------------------------------------------------------"
    );
    const tagsNecessarias = localEscala.necessidades.filter((necessidade) => {
      return !!necessidade.tag;
    });
    const tagsNaoEncontradas = localEscala.necessidades.filter(
      (necessidade) => {
        return !!necessidade.tag;
      }
    );
    const cargosNecessarios = localEscala.necessidades.filter((necessida) => {
      return necessida.cargo;
    });
    cargosNecessarios.forEach((necessidadeDeCargo) => {
      debug("--cargoNecessario", necessidadeDeCargo);
      const cargoNecessario = necessidadeDeCargo.cargo;
      const quantidadeNecessaria = necessidadeDeCargo.quantidade;
      const filaDeProfissionaisPorCargo = profissionaisMap[cargoNecessario];
      if (!filaDeProfissionaisPorCargo) {
        throw new Error(
          `Profissional cargo "${necessidadeDeCargo.cargo}" não encontrado para o dia "${dia}" no local "${necessidadeDeCargo.local}"`
        );
      }
      for (let i = 0; i < quantidadeNecessaria; i++) {
        const profissionalCargoEscolhido = filaDeProfissionaisPorCargo.shift();
        filaDeProfissionaisPorCargo.push(profissionalCargoEscolhido);
        const escala = mapEscala(
          profissionalCargoEscolhido,
          necessidadeDeCargo.cargo,
          localEscala.local,
          dia
        );
        debug("profissionalCargoEscolhido", profissionalCargoEscolhido);
        debug("escala", escala);
        escalas.push(escala);
      }
    });
    tagsNecessarias.forEach((tagNecessaria) => {
      const tagFound = escalas.find((escala) => {
        return (
          escala.local === localEscala.local &&
          escala.tags.includes(tagNecessaria.tag)
        );
      });
      if (tagFound) {
        debug("tagFound", tagFound);
        removeItemOnce(tagsNaoEncontradas, tagNecessaria.tag);
      }
    });
    tagsNaoEncontradas.forEach((tagNaoEncontrada) => {
      for (let i = 0; i < tagNaoEncontrada.quantidade; i++) {
        debug("--tagNaoEncontrada", tagNaoEncontrada);
        const filaDeProfissionaisPorTag =
          profissionaisMap[tagNaoEncontrada.tag];
        if (!filaDeProfissionaisPorTag) {
          throw new Error(
            `Profissional tag "${tagNaoEncontrada}" não encontrado para o dia "${dia}" no local "${regra.local}"`
          );
        }
        const profissionalTagEscolhido = filaDeProfissionaisPorTag.shift();
        filaDeProfissionaisPorTag.push(profissionalTagEscolhido);
        const escala = mapEscala(
          profissionalTagEscolhido,
          tagNaoEncontrada.tag,
          localEscala.local,
          dia
        );
        debug("profissionalTagEscolhido", profissionalTagEscolhido);
        debug("escala", escala);
        escalas.push(escala);
      }
    });
  });
  return escalas;
};

function removeItemOnce(arr, value) {
  var index = arr.indexOf(value);
  if (index > -1) {
    arr.splice(index, 1);
  }
  return arr;
}
