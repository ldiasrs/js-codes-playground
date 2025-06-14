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
  valorLiquido: number,
  source: "bank" | "base" = "base"
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
    source,
  };
}

describe('mergeInvests', () => {
  describe('Perfect Match Scenarios', () => {
    test('should match investments with identical data', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
        createInvestItem("2", "Tesouro Direto", "10.0%", "002", 500000, 500000, "2023-02-20", "2024-02-20", 550000, "base"),
      ];

      const bankInvests = [
        createInvestItem("3", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "bank"),
        createInvestItem("4", "Tesouro Direto", "10.0%", "002", 500000, 500000, "2023-02-20", "2024-02-20", 550000, "bank"),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(2);
      expect(result.conflicts).toHaveLength(0);
      expect(result.matchedAtivos[0].ativo).toBe("CDB Banco ABC");
      expect(result.matchedAtivos[1].ativo).toBe("Tesouro Direto");
    });

    test('should match investments with same ativo, dates, and amounts but different taxa', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];

      const bankInvests = [
        createInvestItem("2", "CDB Banco ABC", "13.0%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1130000, "bank"),
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
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];

      const bankInvests = [
        createInvestItem("2", "Tesouro Direto", "10.0%", "002", 500000, 500000, "2023-02-20", "2024-02-20", 550000, "bank"),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(2);
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      const bankConflict = result.conflicts.find(c => c.source === 'bank');
      
      expect(baseConflict?.ativo).toBe("CDB Banco ABC");
      expect(bankConflict?.ativo).toBe("Tesouro Direto");
      expect(baseConflict?.cause).toBe("ASSET_NAME_MISSMATCH");
      expect(bankConflict?.cause).toBe("ASSET_NOT_FOUND_IN_BASE");
    });

    test('should identify conflicts when ativo names differ and set appropriate cause', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];

      const bankInvests = [
        createInvestItem("2", "Tesouro Direto", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "bank"),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(2);
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      const bankConflict = result.conflicts.find(c => c.source === 'bank');
      
      expect(baseConflict?.cause).toBe("ASSET_NAME_MISSMATCH");
      expect(bankConflict?.cause).toBe("ASSET_NOT_FOUND_IN_BASE");
    });

    test('should identify conflicts when purchase dates differ by more than 2 days and set DATE_MISSMATCH_PURCHASE cause', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];

      const bankInvests = [
        createInvestItem("2", "CDB Banco ABC", "12.5%", "002", 1000000, 1000000, "2023-01-18", "2024-01-18", 1125000, "bank"),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(2);
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      expect(baseConflict?.cause).toBe("DATE_MISSMATCH_PURCHASE");
    });

    test('should identify conflicts when maturity dates differ by more than 2 days and set DATE_MISSMATCH_DUE cause', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];

      const bankInvests = [
        createInvestItem("2", "CDB Banco ABC", "12.5%", "002", 1000000, 1000000, "2023-01-15", "2024-01-18", 1125000, "bank"),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(2);
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      expect(baseConflict?.cause).toBe("DATE_MISSMATCH_DUE");
    });

    test('should identify conflicts when amounts differ by more than 50 and set AMOUNT_MISSMATCH cause', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];

      const bankInvests = [
        createInvestItem("2", "CDB Banco ABC", "12.5%", "002", 1100000, 1100000, "2023-01-15", "2024-01-15", 1237500, "bank"),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(2);
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      expect(baseConflict?.cause).toBe("AMOUNT_MISSMATCH");
    });

    test('should identify multiple criteria mismatch when several fields differ', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];

      const bankInvests = [
        createInvestItem("2", "CDB Banco ABC", "12.5%", "002", 1100000, 1100000, "2023-01-18", "2024-01-18", 1237500, "bank"),
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
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
        createInvestItem("2", "Tesouro Direto", "10.0%", "002", 500000, 500000, "2023-02-20", "2024-02-20", 550000, "base"),
        createInvestItem("3", "LCI Banco XYZ", "8.5%", "003", 750000, 750000, "2023-03-10", "2024-03-10", 813750, "base"),
      ];

      const bankInvests = [
        createInvestItem("4", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "bank"),
        createInvestItem("5", "Tesouro Direto", "10.0%", "002", 500000, 500000, "2023-02-20", "2024-02-20", 550000, "bank"),
        createInvestItem("6", "Fundos Imobiliários", "6.0%", "004", 300000, 300000, "2023-04-05", "2024-04-05", 318000, "bank"),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(2);
      expect(result.conflicts).toHaveLength(2);

      const baseConflicts = result.conflicts.filter(c => c.source === 'base');
      const bankConflicts = result.conflicts.filter(c => c.source === 'bank');

      expect(baseConflicts).toHaveLength(1);
      expect(bankConflicts).toHaveLength(1);
      expect(baseConflicts[0].cause).toBe("ASSET_NAME_MISSMATCH");
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
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "bank"),
      ];

      const result = mergeInvests([], bankInvests);

      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].source).toBe("bank");
      expect(result.conflicts[0].cause).toBe("ASSET_NOT_FOUND_IN_BASE");
    });

    test('should handle empty bank array', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
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
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
        createInvestItem("2", "Tesouro Direto", "10.0%", "002", 500000, 500000, "2023-02-20", "2024-02-20", 550000, "base"),
        createInvestItem("3", "LCI Banco XYZ", "8.5%", "003", 750000, 750000, "2023-03-10", "2024-03-10", 813750, "base"),
        createInvestItem("4", "Fundos Imobiliários", "6.0%", "004", 300000, 300000, "2023-04-05", "2024-04-05", 318000, "base"),
      ];

      const bankInvests = [
        createInvestItem("5", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "bank"),
        createInvestItem("6", "Tesouro Direto", "10.0%", "002", 500000, 500000, "2023-02-20", "2024-02-20", 550000, "bank"),
        createInvestItem("7", "Ações Petrobras", "15.0%", "005", 200000, 200000, "2023-05-01", "2024-05-01", 230000, "bank"),
        createInvestItem("8", "Ações Vale", "12.0%", "006", 400000, 400000, "2023-06-15", "2024-06-15", 448000, "bank"),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(2);
      expect(result.conflicts).toHaveLength(4);

      const baseConflicts = result.conflicts.filter(c => c.source === 'base');
      const bankConflicts = result.conflicts.filter(c => c.source === 'bank');

      expect(baseConflicts).toHaveLength(2);
      expect(bankConflicts).toHaveLength(2);

      expect(baseConflicts.every(c => c.cause === "ASSET_NAME_MISSMATCH")).toBe(true);
      expect(bankConflicts.every(c => c.cause === "ASSET_NOT_FOUND_IN_BASE")).toBe(true);
    });
  });

  describe('Data Integrity', () => {
    test('should preserve original data in matched items', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];

      const bankInvests = [
        createInvestItem("2", "CDB Banco ABC", "12.5%", "002", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "bank"),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(1);
      const matchedItem = result.matchedAtivos[0];

      // Should use bank's values for these fields
      expect(matchedItem.valorBruto.getAmount()).toBe(1000000);
      expect(matchedItem.numeroNota).toBe("002");
      expect(matchedItem.valorLiquido.getAmount()).toBe(1125000);
    });

    test('should mark conflicts with correct source and cause', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];

      const bankInvests = [
        createInvestItem("2", "Tesouro Direto", "10.0%", "002", 500000, 500000, "2023-02-20", "2024-02-20", 550000, "bank"),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(2);

      const baseConflict = result.conflicts.find(c => c.source === 'base');
      const bankConflict = result.conflicts.find(c => c.source === 'bank');

      expect(baseConflict?.ativo).toBe("CDB Banco ABC");
      expect(bankConflict?.ativo).toBe("Tesouro Direto");
      expect(baseConflict?.cause).toBe("ASSET_NAME_MISSMATCH");
      expect(bankConflict?.cause).toBe("ASSET_NOT_FOUND_IN_BASE");
    });
  });

  describe('Conflict Cause Specificity', () => {
    test('should prioritize first mismatch found in comparison order', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];

      const bankInvests = [
        createInvestItem("2", "CDB Banco ABC", "12.5%", "002", 1100000, 1100000, "2023-01-18", "2024-01-18", 1237500, "bank"),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(2);
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      expect(baseConflict?.cause).toBe("DATE_MISSMATCH_PURCHASE");
    });

    test('should handle case sensitivity in ativo names', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];

      const bankInvests = [
        createInvestItem("2", "CDB BANCO ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "bank"),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(1);
      expect(result.conflicts).toHaveLength(0);
      expect(result.matchedAtivos[0].ativo).toBe("CDB BANCO ABC");
    });
  });

  describe('Threshold and fuzzy match scenarios', () => {
    test('should match if purchase date differs by 2 days and use bank date', () => {
      const baseInvests = [
        createInvestItem("1", "CDB AGIBANK", "12.5%", "001", 1000000, 1000000, "2023-01-13", "2024-01-15", 1125000, "base"),
      ];
      const bankInvests = [
        createInvestItem("2", "CDB AGIBANK", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "bank"),
      ];
      const result = mergeInvests(baseInvests, bankInvests);
      expect(result.matchedAtivos).toHaveLength(1);
      expect(result.matchedAtivos[0].dataCompra.isSame(moment("2023-01-15", "YYYY-MM-DD"))).toBe(true);
      
      // Should also appear in conflicts with WARN level - both base and bank items
      const thresholdConflicts = result.conflicts.filter(c => c.cause === 'THRESHOLD_MATCH');
      expect(thresholdConflicts).toHaveLength(2);
      expect(thresholdConflicts.every(c => c.validationLvl === "WARN")).toBe(true);
      
      const baseConflict = thresholdConflicts.find(c => c.id === "1");
      const bankConflict = thresholdConflicts.find(c => c.id === "2");
      expect(baseConflict).toBeDefined();
      expect(bankConflict).toBeDefined();
    });

    test('should match if due date differs by 2 days and use bank date', () => {
      const baseInvests = [
        createInvestItem("1", "CDB AGIBANK", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-13", 1125000, "base"),
      ];
      const bankInvests = [
        createInvestItem("2", "CDB AGIBANK", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "bank"),
      ];
      const result = mergeInvests(baseInvests, bankInvests);
      expect(result.matchedAtivos).toHaveLength(1);
      expect(result.matchedAtivos[0].dataVencimento.isSame(moment("2024-01-15", "YYYY-MM-DD"))).toBe(true);
      
      // Should also appear in conflicts with WARN level - both base and bank items
      const thresholdConflicts = result.conflicts.filter(c => c.cause === 'THRESHOLD_MATCH');
      expect(thresholdConflicts).toHaveLength(2);
      expect(thresholdConflicts.every(c => c.validationLvl === "WARN")).toBe(true);
    });

    test('should match if amounts differ by 50 and use bank amount', () => {
      const baseInvests = [
        createInvestItem("1", "CDB AGIBANK", "12.5%", "001", 1000050, 1000050, "2023-01-15", "2024-01-15", 1125050, "base"),
      ];
      const bankInvests = [
        createInvestItem("2", "CDB AGIBANK", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "bank"),
      ];
      const result = mergeInvests(baseInvests, bankInvests);
      expect(result.matchedAtivos).toHaveLength(1);
      expect(result.matchedAtivos[0].aplicado.getAmount()).toBe(1000000);
      
      // Should also appear in conflicts with WARN level - both base and bank items
      const thresholdConflicts = result.conflicts.filter(c => c.cause === 'THRESHOLD_MATCH');
      expect(thresholdConflicts).toHaveLength(2);
      expect(thresholdConflicts.every(c => c.validationLvl === "WARN")).toBe(true);
    });

    test('should match if ativo names start similarly and use bank ativo', () => {
      const baseInvests = [
        createInvestItem("1", "CDB AGIBANK", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];
      const bankInvests = [
        createInvestItem("2", "CDB AGIBANK SA", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "bank"),
      ];
      const result = mergeInvests(baseInvests, bankInvests);
      expect(result.matchedAtivos).toHaveLength(1);
      expect(result.matchedAtivos[0].ativo).toBe("CDB AGIBANK SA");
      
      // Should also appear in conflicts with WARN level - both base and bank items
      const thresholdConflicts = result.conflicts.filter(c => c.cause === 'THRESHOLD_MATCH');
      expect(thresholdConflicts).toHaveLength(2);
      expect(thresholdConflicts.every(c => c.validationLvl === "WARN")).toBe(true);
    });

    test('should have ERROR validation level for non-threshold conflicts', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];
      const bankInvests = [
        createInvestItem("2", "Tesouro Direto", "10.0%", "002", 500000, 500000, "2023-02-20", "2024-02-20", 550000, "bank"),
      ];
      const result = mergeInvests(baseInvests, bankInvests);
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      const bankConflict = result.conflicts.find(c => c.source === 'bank');
      
      expect(baseConflict?.validationLvl).toBe("ERROR");
      expect(bankConflict?.validationLvl).toBe("ERROR");
    });

    test('should have ERROR validation level for threshold-exceeding conflicts', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];
      const bankInvests = [
        createInvestItem("2", "CDB Banco ABC", "12.5%", "002", 1100000, 1100000, "2023-01-18", "2024-01-18", 1237500, "bank"),
      ];
      const result = mergeInvests(baseInvests, bankInvests);
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      expect(baseConflict?.validationLvl).toBe("ERROR");
    });
  });

  describe('Configurable Threshold Scenarios', () => {
    test('should use custom date threshold when provided', () => {
      const baseInvests = [
        createInvestItem("1", "CDB AGIBANK", "12.5%", "001", 1000000, 1000000, "2023-01-13", "2024-01-15", 1125000, "base"),
      ];
      const bankInvests = [
        createInvestItem("2", "CDB AGIBANK", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "bank"),
      ];
      
      // Should match with default config (2 days)
      const resultWithDefault = mergeInvests(baseInvests, bankInvests);
      expect(resultWithDefault.matchedAtivos).toHaveLength(1);
      
      // Should not match with 1 day threshold
      const resultWithCustom = mergeInvests(baseInvests, bankInvests, { dateThresholdDays: 1 });
      expect(resultWithCustom.matchedAtivos).toHaveLength(0);
      expect(resultWithCustom.conflicts).toHaveLength(2);
    });

    test('should use custom amount threshold when provided', () => {
      const baseInvests = [
        createInvestItem("1", "CDB AGIBANK", "12.5%", "001", 1000050, 1000050, "2023-01-15", "2024-01-15", 1125050, "base"),
      ];
      const bankInvests = [
        createInvestItem("2", "CDB AGIBANK", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "bank"),
      ];
      
      // Should match with default config (50)
      const resultWithDefault = mergeInvests(baseInvests, bankInvests);
      expect(resultWithDefault.matchedAtivos).toHaveLength(1);
      
      // Should not match with 25 threshold
      const resultWithCustom = mergeInvests(baseInvests, bankInvests, { amountThreshold: 25 });
      expect(resultWithCustom.matchedAtivos).toHaveLength(0);
      expect(resultWithCustom.conflicts).toHaveLength(2);
    });

    test('should disable fuzzy ativo matching when configured', () => {
      const baseInvests = [
        createInvestItem("1", "CDB AGIBANK", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];
      const bankInvests = [
        createInvestItem("2", "CDB AGIBANK SA", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "bank"),
      ];
      
      // Should match with default config (fuzzy enabled)
      const resultWithDefault = mergeInvests(baseInvests, bankInvests);
      expect(resultWithDefault.matchedAtivos).toHaveLength(1);
      
      // Should not match with fuzzy disabled
      const resultWithCustom = mergeInvests(baseInvests, bankInvests, { enableFuzzyAtivoMatch: false });
      expect(resultWithCustom.matchedAtivos).toHaveLength(0);
      expect(resultWithCustom.conflicts).toHaveLength(2);
    });

    test('should use all custom config options together', () => {
      const baseInvests = [
        createInvestItem("1", "CDB AGIBANK", "12.5%", "001", 1000050, 1000050, "2023-01-13", "2024-01-15", 1125050, "base"),
      ];
      const bankInvests = [
        createInvestItem("2", "CDB AGIBANK SA", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "bank"),
      ];
      
      const customConfig = {
        dateThresholdDays: 1,
        amountThreshold: 25,
        enableFuzzyAtivoMatch: false,
      };
      
      const result = mergeInvests(baseInvests, bankInvests, customConfig);
      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(2);
    });

    test('should work with partial config options', () => {
      const baseInvests = [
        createInvestItem("1", "CDB AGIBANK", "12.5%", "001", 1000050, 1000050, "2023-01-15", "2024-01-15", 1125050, "base"),
      ];
      const bankInvests = [
        createInvestItem("2", "CDB AGIBANK", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "bank"),
      ];
      
      // Only override amount threshold, keep other defaults
      const result = mergeInvests(baseInvests, bankInvests, { amountThreshold: 25 });
      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(2);
    });

    test('should mark overdue investments with OVERDUE_INVEST cause', () => {
      const baseInvests = [
        createInvestItem("1", "CDB AGIBANK", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2023-12-31", 1125000, "base"),
      ];
      const bankInvests = [
        createInvestItem("2", "Tesouro Direto", "10.0%", "002", 500000, 500000, "2023-02-20", "2024-02-20", 550000, "bank"),
      ];
      
      const compareDate = moment("2024-01-15", "YYYY-MM-DD");
      const result = mergeInvests(baseInvests, bankInvests, { compareDate });
      
      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(2);
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      const bankConflict = result.conflicts.find(c => c.source === 'bank');
      
      expect(baseConflict?.cause).toBe("OVERDUE_INVEST");
      expect(bankConflict?.cause).toBe("ASSET_NOT_FOUND_IN_BASE");
    });

    test('should not mark non-overdue investments with OVERDUE_INVEST cause', () => {
      const baseInvests = [
        createInvestItem("1", "CDB AGIBANK", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-12-31", 1125000, "base"),
      ];
      const bankInvests = [
        createInvestItem("2", "Tesouro Direto", "10.0%", "002", 500000, 500000, "2023-02-20", "2024-02-20", 550000, "bank"),
      ];
      
      const compareDate = moment("2024-01-15", "YYYY-MM-DD");
      const result = mergeInvests(baseInvests, bankInvests, { compareDate });
      
      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(2);
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      const bankConflict = result.conflicts.find(c => c.source === 'bank');
      
      expect(baseConflict?.cause).toBe("ASSET_NAME_MISSMATCH");
      expect(bankConflict?.cause).toBe("ASSET_NOT_FOUND_IN_BASE");
    });

    test('should prioritize OVERDUE_INVEST over other causes', () => {
      const baseInvests = [
        createInvestItem("1", "CDB AGIBANK", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2023-12-31", 1125000, "base"),
      ];
      const bankInvests = [
        createInvestItem("2", "CDB AGIBANK", "12.5%", "002", 1100000, 1100000, "2023-01-15", "2024-12-31", 1237500, "bank"),
      ];
      
      const compareDate = moment("2024-01-15", "YYYY-MM-DD");
      const result = mergeInvests(baseInvests, bankInvests, { compareDate });
      
      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(2);
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      const bankConflict = result.conflicts.find(c => c.source === 'bank');
      
      expect(baseConflict?.cause).toBe("OVERDUE_INVEST");
      expect(bankConflict?.cause).toBe("ASSET_NOT_FOUND_IN_BASE");
    });

    test('should work without compareDate (backward compatibility)', () => {
      const baseInvests = [
        createInvestItem("1", "CDB AGIBANK", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2023-12-31", 1125000, "base"),
      ];
      const bankInvests = [
        createInvestItem("2", "Tesouro Direto", "10.0%", "002", 500000, 500000, "2023-02-20", "2024-02-20", 550000, "bank"),
      ];
      
      const result = mergeInvests(baseInvests, bankInvests);
      
      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(2);
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      expect(baseConflict?.cause).toBe("ASSET_NAME_MISSMATCH");
    });
  });
}); 