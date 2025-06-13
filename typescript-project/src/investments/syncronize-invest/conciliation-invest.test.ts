import { mergeInvests } from './conciliation-invest';
import moment from 'moment';
import Dinero from 'dinero.js';

// Helper function to create test invest items
function createInvestItem(
  id: string,
  ativo: string,
  taxa: string,
  numeroNota: string,
  aplicado: number,
  valorBruto: number,
  dataCompra: string,
  dataVencimento: string,
  valorLiquido: number
) {
  return {
    id,
    ativo,
    taxa,
    numeroNota,
    aplicado: Dinero({ amount: aplicado, currency: 'BRL' }),
    valorBruto: Dinero({ amount: valorBruto, currency: 'BRL' }),
    dataCompra: moment(dataCompra, 'YYYY-MM-DD'),
    dataVencimento: moment(dataVencimento, 'YYYY-MM-DD'),
    valorLiquido: Dinero({ amount: valorLiquido, currency: 'BRL' }),
  };
}

describe('mergeInvests', () => {
  describe('Perfect Match Scenarios', () => {
    test('should match investments with identical data', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000),
        createInvestItem("2", "Tesouro Direto", "10.0%", "002", 500000, 500000, "2023-02-20", "2024-02-20", 550000),
      ];

      const bankInvests = [
        createInvestItem("3", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000),
        createInvestItem("4", "Tesouro Direto", "10.0%", "002", 500000, 500000, "2023-02-20", "2024-02-20", 550000),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(2);
      expect(result.conflicts).toHaveLength(0);
      expect(result.matchedAtivos[0].ativo).toBe("CDB Banco ABC");
      expect(result.matchedAtivos[1].ativo).toBe("Tesouro Direto");
    });

    test('should match investments with same ativo, dates, and amounts but different taxa', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000),
      ];

      const bankInvests = [
        createInvestItem("2", "CDB Banco ABC", "13.0%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1130000),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(1);
      expect(result.conflicts).toHaveLength(0);
      expect(result.matchedAtivos[0].ativo).toBe("CDB Banco ABC");
    });
  });

  describe('Conflict Scenarios with Cause Identification', () => {
    test('should identify conflicts when no investments match and set appropriate causes', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000),
      ];

      const bankInvests = [
        createInvestItem("2", "Tesouro Direto", "10.0%", "002", 500000, 500000, "2023-02-20", "2024-02-20", 550000),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(2);
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      const bankConflict = result.conflicts.find(c => c.source === 'bank');
      
      expect(baseConflict?.ativo).toBe("CDB Banco ABC");
      expect(bankConflict?.ativo).toBe("Tesouro Direto");
      expect(baseConflict?.cause).toBe("ASSET_NOT_FOUND_IN_BANK");
      expect(bankConflict?.cause).toBe("ASSET_NOT_FOUND_IN_BASE");
    });

    test('should identify conflicts when ativo names differ and set appropriate cause', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000),
      ];

      const bankInvests = [
        createInvestItem("2", "cdb banco abc", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(2);
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      const bankConflict = result.conflicts.find(c => c.source === 'bank');
      
      expect(baseConflict?.cause).toBe("ASSET_NOT_FOUND_IN_BANK");
      expect(bankConflict?.cause).toBe("ASSET_NOT_FOUND_IN_BASE");
    });

    test('should identify conflicts when purchase dates differ and set DATE_MISSMATCH_PURCHASE cause', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000),
      ];

      const bankInvests = [
        createInvestItem("2", "CDB Banco ABC", "12.5%", "002", 1000000, 1000000, "2023-01-16", "2024-01-16", 1125000),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(2);
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      expect(baseConflict?.cause).toBe("DATE_MISSMATCH_PURCHASE");
    });

    test('should identify conflicts when maturity dates differ and set DATE_MISSMATCH_DUE cause', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000),
      ];

      const bankInvests = [
        createInvestItem("2", "CDB Banco ABC", "12.5%", "002", 1000000, 1000000, "2023-01-15", "2024-01-16", 1125000),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(2);
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      expect(baseConflict?.cause).toBe("DATE_MISSMATCH_DUE");
    });

    test('should identify conflicts when amounts differ and set AMOUNT_MISSMATCH cause', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000),
      ];

      const bankInvests = [
        createInvestItem("2", "CDB Banco ABC", "12.5%", "002", 1100000, 1100000, "2023-01-15", "2024-01-15", 1237500),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(2);
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      expect(baseConflict?.cause).toBe("AMOUNT_MISSMATCH");
    });

    test('should identify multiple criteria mismatch when several fields differ', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000),
      ];

      const bankInvests = [
        createInvestItem("2", "CDB Banco ABC", "12.5%", "002", 1100000, 1100000, "2023-01-16", "2024-01-16", 1237500),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(2);
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      expect(baseConflict?.cause).toBe("DATE_MISSMATCH_PURCHASE");
    });
  });

  describe('Partial Match Scenarios', () => {
    test('should handle partial matches correctly', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000),
        createInvestItem("2", "Tesouro Direto", "10.0%", "002", 500000, 500000, "2023-02-20", "2024-02-20", 550000),
        createInvestItem("3", "LCI Banco XYZ", "8.5%", "003", 750000, 750000, "2023-03-10", "2024-03-10", 813750),
      ];

      const bankInvests = [
        createInvestItem("4", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000),
        createInvestItem("5", "Tesouro Direto", "10.0%", "002", 500000, 500000, "2023-02-20", "2024-02-20", 550000),
        createInvestItem("6", "Fundos Imobiliários", "6.0%", "004", 300000, 300000, "2023-04-05", "2024-04-05", 318000),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(2);
      expect(result.conflicts).toHaveLength(2);
      expect(result.matchedAtivos.map(m => m.ativo)).toContain("CDB Banco ABC");
      expect(result.matchedAtivos.map(m => m.ativo)).toContain("Tesouro Direto");
      
      // Check that conflicts have appropriate causes
      const baseConflicts = result.conflicts.filter(c => c.source === 'base');
      const bankConflicts = result.conflicts.filter(c => c.source === 'bank');
      
      expect(baseConflicts).toHaveLength(1);
      expect(bankConflicts).toHaveLength(1);
      expect(baseConflicts[0].cause).toBe("ASSET_NOT_FOUND_IN_BANK");
      expect(bankConflicts[0].cause).toBe("ASSET_NOT_FOUND_IN_BASE");
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty arrays', () => {
      const result = mergeInvests([], []);

      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(0);
    });

    test('should handle empty base array', () => {
      const bankInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000),
      ];

      const result = mergeInvests([], bankInvests);

      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].source).toBe("bank");
      expect(result.conflicts[0].cause).toBe("ASSET_NOT_FOUND_IN_BASE");
    });

    test('should handle empty bank array', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000),
      ];

      const result = mergeInvests(baseInvests, []);

      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].source).toBe("base");
      expect(result.conflicts[0].cause).toBe("ASSET_NOT_FOUND_IN_BANK");
    });
  });

  describe('Complex Scenarios', () => {
    test('should handle multiple matches with conflicts and identify causes', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000),
        createInvestItem("2", "Tesouro Direto", "10.0%", "002", 500000, 500000, "2023-02-20", "2024-02-20", 550000),
        createInvestItem("3", "LCI Banco XYZ", "8.5%", "003", 750000, 750000, "2023-03-10", "2024-03-10", 813750),
        createInvestItem("4", "Fundos Imobiliários", "6.0%", "004", 300000, 300000, "2023-04-05", "2024-04-05", 318000),
      ];

      const bankInvests = [
        createInvestItem("5", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000),
        createInvestItem("6", "Tesouro Direto", "10.0%", "002", 500000, 500000, "2023-02-20", "2024-02-20", 550000),
        createInvestItem("7", "Ações Petrobras", "15.0%", "005", 200000, 200000, "2023-05-01", "2024-05-01", 230000),
        createInvestItem("8", "Ações Vale", "12.0%", "006", 400000, 400000, "2023-06-15", "2024-06-15", 448000),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(2);
      expect(result.conflicts).toHaveLength(4);
      
      // Check matched items
      const matchedAtivos = result.matchedAtivos.map(m => m.ativo);
      expect(matchedAtivos).toContain("CDB Banco ABC");
      expect(matchedAtivos).toContain("Tesouro Direto");
      
      // Check conflicts
      const bankConflicts = result.conflicts.filter(c => c.source === 'bank');
      const baseConflicts = result.conflicts.filter(c => c.source === 'base');
      expect(bankConflicts).toHaveLength(2);
      expect(baseConflicts).toHaveLength(2);
      
      // Check that all conflicts have causes
      result.conflicts.forEach(conflict => {
        expect(conflict.cause).toBeDefined();
        expect(conflict.cause).not.toBe("");
      });
    });
  });

  describe('Data Integrity', () => {
    test('should preserve original data in matched items', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000),
      ];

      const bankInvests = [
        createInvestItem("2", "CDB Banco ABC", "12.5%", "002", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(1);
      const matched = result.matchedAtivos[0];
      
      // Should preserve base data
      expect(matched.id).toBe("1");
      expect(matched.taxa).toBe("12.5%");
      expect(matched.dataCompra.format('YYYY-MM-DD')).toBe("2023-01-15");
      expect(matched.dataVencimento.format('YYYY-MM-DD')).toBe("2024-01-15");
      
      // Should use bank data for valorBruto and numeroNota
      expect(matched.valorBruto.toUnit()).toBe(10000);
      expect(matched.numeroNota).toBe("002");
    });

    test('should mark conflicts with correct source and cause', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000),
      ];

      const bankInvests = [
        createInvestItem("2", "Tesouro Direto", "10.0%", "002", 500000, 500000, "2023-02-20", "2024-02-20", 550000),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.conflicts).toHaveLength(2);
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      const bankConflict = result.conflicts.find(c => c.source === 'bank');
      
      expect(baseConflict).toBeDefined();
      expect(bankConflict).toBeDefined();
      expect(baseConflict?.ativo).toBe("CDB Banco ABC");
      expect(bankConflict?.ativo).toBe("Tesouro Direto");
      expect(baseConflict?.cause).toBe("ASSET_NOT_FOUND_IN_BANK");
      expect(bankConflict?.cause).toBe("ASSET_NOT_FOUND_IN_BASE");
    });
  });

  describe('Conflict Cause Specificity', () => {
    test('should prioritize first mismatch found in comparison order', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000),
      ];

      const bankInvests = [
        createInvestItem("2", "CDB Banco ABC", "12.5%", "002", 1100000, 1100000, "2023-01-16", "2024-01-16", 1237500),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(2);
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      expect(baseConflict?.cause).toBe("DATE_MISSMATCH_PURCHASE");
    });

    test('should handle case sensitivity in ativo names', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000),
      ];

      const bankInvests = [
        createInvestItem("2", "CDB BANCO ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(2);
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      expect(baseConflict?.cause).toBe("ASSET_NOT_FOUND_IN_BANK");
    });
  });
}); 