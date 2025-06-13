"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeInvests = mergeInvests;
function mergeInvests(baseInvests, bankInvests) {
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
            if (!baseDataCompra.isSame(bankDataCompra)) {
                return false;
            }
            const baseDataVencimento = ativoBase.dataVencimento;
            const bankDataVencimento = ativoBank.dataVencimento;
            if (!baseDataVencimento.isSame(bankDataVencimento)) {
                return false;
            }
            // Compare currency values safely
            const baseAplicado = ativoBase.aplicado;
            const bankAplicado = ativoBank.aplicado;
            // Use Dinero's equals method for comparison
            return baseAplicado.equalsTo(bankAplicado);
        });
        if (!matchBankAtivo) {
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
//# sourceMappingURL=conciliation-invest.js.map