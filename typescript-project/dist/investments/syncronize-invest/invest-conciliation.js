import { debug } from "../common/commons.js";
export function mergeInvests(baseInvests, bankInvests) {
    const baseConflicts = [];
    const matchedAtivos = [];
    const bankInvestMap = new Map();
    bankInvests.forEach((ativo) => {
        bankInvestMap.set(ativo.id, ativo);
    });
    baseInvests.forEach((ativoBase) => {
        const matchBankAtivo = bankInvests.find((ativoBank) => {
            // Compare ativo name
            if (ativoBank.ativo !== ativoBase.ativo) {
                return false;
            }
            // Compare dates safely
            const baseDataCompra = ativoBase.dataCompra;
            const bankDataCompra = ativoBank.dataCompra;
            if (!!baseDataCompra &&
                !!bankDataCompra &&
                !baseDataCompra.isSame(bankDataCompra)) {
                return false;
            }
            const baseDataVencimento = ativoBase.dataVencimento;
            const bankDataVencimento = ativoBank.dataVencimento;
            if (!!baseDataVencimento &&
                !!bankDataVencimento &&
                !baseDataVencimento.isSame(bankDataVencimento)) {
                return false;
            }
            // Compare currency values safely
            const baseAplicado = ativoBase.aplicado;
            const bankAplicado = ativoBank.aplicado;
            // If both are Dinero objects, use equals method
            if (baseAplicado &&
                bankAplicado &&
                typeof baseAplicado.equals === "function" &&
                typeof bankAplicado.equals === "function") {
                return baseAplicado.equals(bankAplicado);
            }
            // Fallback: convert to numbers for comparison
            const baseAmount = baseAplicado
                ? typeof baseAplicado.toUnit === "function"
                    ? baseAplicado.toUnit()
                    : Number(baseAplicado)
                : 0;
            const bankAmount = bankAplicado
                ? typeof bankAplicado.toUnit === "function"
                    ? bankAplicado.toUnit()
                    : Number(bankAplicado)
                : 0;
            return baseAmount === bankAmount;
        });
        if (!matchBankAtivo) {
            debug("Invest not found on bank: ", ativoBase);
            baseConflicts.push(ativoBase);
        }
        else {
            matchedAtivos.push({
                ...ativoBase,
                valorBruto: matchBankAtivo.valorBruto,
                numeroNota: matchBankAtivo.numeroNota,
            });
            bankInvestMap.delete(matchBankAtivo.id);
        }
    });
    bankInvestMap.forEach((ativoBank) => {
        debug("Invest not found on base: ", ativoBank);
    });
    const finalConflicts = [];
    bankInvestMap.forEach((value) => {
        finalConflicts.push({
            source: "bank",
            id: value.id,
            ativo: value.ativo,
            taxa: value.taxa,
            numeroNota: value.numeroNota,
            aplicado: value.aplicado,
            valorBruto: value.valorBruto,
            dataCompra: value.dataCompra,
            dataVencimento: value.dataVencimento,
            valorLiquido: value.valorLiquido,
        });
    });
    baseConflicts.forEach((value) => {
        finalConflicts.push({
            source: "base",
            id: value.id,
            ativo: value.ativo,
            taxa: value.taxa,
            numeroNota: value.numeroNota,
            aplicado: value.aplicado,
            valorBruto: value.valorBruto,
            dataCompra: value.dataCompra,
            dataVencimento: value.dataVencimento,
            valorLiquido: value.valorLiquido,
        });
    });
    return {
        matchedAtivos,
        conflicts: finalConflicts,
    };
}
//# sourceMappingURL=invest-conciliation.js.map