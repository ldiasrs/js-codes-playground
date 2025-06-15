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

// Helper function to check if a conflict has a specific cause
function hasCause(conflict: any, validatorKey: string, resultCode: string): boolean {
  return conflict.causes?.some((cause: any) => 
    cause.validatorKey === validatorKey && cause.validatorResultCode === resultCode
  ) || false;
}

// Helper function to check if a conflict has any partial match
function hasPartialMatch(conflict: any): boolean {
  return conflict.causes?.some((cause: any) => cause.validatorResultCode === "PARTIAL_MATCH") || false;
}

// Helper function to get primary cause for backward compatibility
function getPrimaryCause(conflict: any): string {
  if (!conflict.causes || conflict.causes.length === 0) {
    return "UNKNOWN";
  }
  
  // Check for specific causes in order of priority
  if (hasCause(conflict, "ATIVO_NAME", "UNMATCHED")) {
    return "ASSET_NAME_MISSMATCH";
  }
  if (hasCause(conflict, "PURCHASE_DATE", "UNMATCHED")) {
    return "DATE_MISSMATCH_PURCHASE";
  }
  if (hasCause(conflict, "DUE_DATE", "UNMATCHED")) {
    return "DATE_MISSMATCH_DUE";
  }
  if (hasCause(conflict, "AMOUNT", "UNMATCHED")) {
    return "AMOUNT_MISSMATCH";
  }
  if (hasPartialMatch(conflict)) {
    return "THRESHOLD_MATCH";
  }
  
  return "MULTIPLE_CRITERIA_MISSMATCH";
}

describe('mergeInvests - Complete Test Suite', () => {
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
      expect(result.matchedAtivos[0].taxa).toBe("12.5%"); // Should keep base taxa
    });
  });

  describe('Validation Results Structure', () => {
    test('should have proper causes structure for conflicts', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];

      const bankInvests = [
        createInvestItem("2", "Tesouro Direto", "10.0%", "002", 500000, 500000, "2023-02-20", "2024-02-20", 550000, "bank"),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.conflicts).toHaveLength(2);
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      expect(baseConflict).toBeDefined();
      expect(baseConflict?.causes).toBeDefined();
      expect(Array.isArray(baseConflict?.causes)).toBe(true);
      expect(baseConflict?.causes.length).toBeGreaterThan(0);
      
      // Check that each cause has the required structure
      baseConflict?.causes.forEach(cause => {
        expect(cause).toHaveProperty('validatorKey');
        expect(cause).toHaveProperty('validatorResultCode');
        expect(['MATCHED', 'PARTIAL_MATCH', 'UNMATCHED', '--']).toContain(cause.validatorResultCode);
      });
    });
  });

  describe('Individual Validator Tests', () => {
    test('should fail ATIVO_NAME validation when names are completely different', () => {
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
      expect(hasCause(baseConflict, "FOUND_REFERENCE", "--")).toBe(true);
    });

    test('should pass ATIVO_NAME validation with fuzzy matching', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];

      const bankInvests = [
        createInvestItem("2", "CDB Banco ABC 2024", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "bank"),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(1);
      expect(result.conflicts).toHaveLength(2); // Should still appear in conflicts due to PARTIAL_MATCH
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      expect(hasCause(baseConflict, "ATIVO_NAME", "PARTIAL_MATCH")).toBe(true);
    });

    test('should fail PURCHASE_DATE validation when dates differ by more than threshold', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];

      const bankInvests = [
        createInvestItem("2", "CDB Banco ABC", "12.5%", "002", 1000000, 1000000, "2023-01-18", "2024-01-15", 1125000, "bank"),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(2);
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      expect(hasCause(baseConflict, "FOUND_REFERENCE", "--")).toBe(true);
    });

    test('should pass PURCHASE_DATE validation with threshold matching', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];

      const bankInvests = [
        createInvestItem("2", "CDB Banco ABC", "12.5%", "002", 1000000, 1000000, "2023-01-17", "2024-01-15", 1125000, "bank"),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(1);
      expect(result.conflicts).toHaveLength(2); // Should still appear in conflicts due to PARTIAL_MATCH
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      expect(hasCause(baseConflict, "PURCHASE_DATE", "PARTIAL_MATCH")).toBe(true);
    });

    test('should fail DUE_DATE validation when dates differ by more than threshold', () => {
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
      expect(hasCause(baseConflict, "FOUND_REFERENCE", "--")).toBe(true);
    });

    test('should pass DUE_DATE validation with threshold matching', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];

      const bankInvests = [
        createInvestItem("2", "CDB Banco ABC", "12.5%", "002", 1000000, 1000000, "2023-01-15", "2024-01-17", 1125000, "bank"),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(1);
      expect(result.conflicts).toHaveLength(2); // Should still appear in conflicts due to PARTIAL_MATCH
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      expect(hasCause(baseConflict, "DUE_DATE", "PARTIAL_MATCH")).toBe(true);
    });

    test('should fail AMOUNT validation when amounts differ by more than threshold', () => {
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
      expect(hasCause(baseConflict, "FOUND_REFERENCE", "--")).toBe(true);
    });

    test('should pass AMOUNT validation with threshold matching', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];

      const bankInvests = [
        createInvestItem("2", "CDB Banco ABC", "12.5%", "002", 1000025, 1000025, "2023-01-15", "2024-01-15", 1125028, "bank"),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(1);
      expect(result.conflicts).toHaveLength(2); // Should still appear in conflicts due to PARTIAL_MATCH
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      expect(hasCause(baseConflict, "AMOUNT", "PARTIAL_MATCH")).toBe(true);
    });
  });

  describe('Configurable Threshold Tests', () => {
    test('should use custom date threshold', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];

      const bankInvests = [
        createInvestItem("2", "CDB Banco ABC", "12.5%", "002", 1000000, 1000000, "2023-01-18", "2024-01-18", 1125000, "bank"),
      ];

      // With default threshold (2 days), should not match
      const resultDefault = mergeInvests(baseInvests, bankInvests);
      expect(resultDefault.matchedAtivos).toHaveLength(0);
      expect(resultDefault.conflicts).toHaveLength(2);

      // With custom threshold (5 days), should match
      const resultCustom = mergeInvests(baseInvests, bankInvests, { dateThresholdDays: 5 });
      expect(resultCustom.matchedAtivos).toHaveLength(1);
      expect(resultCustom.conflicts).toHaveLength(2); // Should still appear in conflicts due to PARTIAL_MATCH
    });

    test('should use custom amount threshold', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];

      const bankInvests = [
        createInvestItem("2", "CDB Banco ABC", "12.5%", "002", 1000100, 1000100, "2023-01-15", "2024-01-15", 1125112, "bank"),
      ];

      // With default threshold (50), should not match
      const resultDefault = mergeInvests(baseInvests, bankInvests);
      expect(resultDefault.matchedAtivos).toHaveLength(0);
      expect(resultDefault.conflicts).toHaveLength(2);

      // With custom threshold (200), should match
      const resultCustom = mergeInvests(baseInvests, bankInvests, { amountThreshold: 200 });
      expect(resultCustom.matchedAtivos).toHaveLength(1);
      expect(resultCustom.conflicts).toHaveLength(2); // Should still appear in conflicts due to PARTIAL_MATCH
    });

    test('should disable fuzzy ativo matching', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];

      const bankInvests = [
        createInvestItem("2", "CDB Banco ABC 2024", "12.5%", "002", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "bank"),
      ];

      // With fuzzy enabled (default), should match
      const resultDefault = mergeInvests(baseInvests, bankInvests);
      expect(resultDefault.matchedAtivos).toHaveLength(1);
      expect(resultDefault.conflicts).toHaveLength(2);

      // With fuzzy disabled, should not match
      const resultCustom = mergeInvests(baseInvests, bankInvests, { enableFuzzyAtivoMatch: false });
      expect(resultCustom.matchedAtivos).toHaveLength(0);
      expect(resultCustom.conflicts).toHaveLength(2);
    });
  });

  describe('Partial Match Scenarios', () => {
    test('should create conflicts for partial matches', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];

      const bankInvests = [
        createInvestItem("2", "CDB Banco ABC 2024", "12.5%", "002", 1000050, 1000050, "2023-01-17", "2024-01-17", 1125056, "bank"),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(1);
      expect(result.conflicts).toHaveLength(2); // Both base and bank items should appear

      const baseConflict = result.conflicts.find(c => c.source === 'base');
      const bankConflict = result.conflicts.find(c => c.source === 'bank');

      expect(hasCause(baseConflict, "ATIVO_NAME", "PARTIAL_MATCH")).toBe(true);
      expect(hasCause(baseConflict, "PURCHASE_DATE", "PARTIAL_MATCH")).toBe(true);
      expect(hasCause(baseConflict, "DUE_DATE", "PARTIAL_MATCH")).toBe(true);
      expect(hasCause(baseConflict, "AMOUNT", "PARTIAL_MATCH")).toBe(true);

      expect(hasCause(bankConflict, "ATIVO_NAME", "PARTIAL_MATCH")).toBe(true);
      expect(hasCause(bankConflict, "PURCHASE_DATE", "PARTIAL_MATCH")).toBe(true);
      expect(hasCause(bankConflict, "DUE_DATE", "PARTIAL_MATCH")).toBe(true);
      expect(hasCause(bankConflict, "AMOUNT", "PARTIAL_MATCH")).toBe(true);
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
      expect(hasCause(result.conflicts[0], "ATIVO_NAME", "UNMATCHED")).toBe(true);
    });

    test('should handle empty bank array', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];

      const result = mergeInvests(baseInvests, []);

      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].source).toBe("base");
      expect(hasCause(result.conflicts[0], "FOUND_REFERENCE", "--")).toBe(true);
    });
  });

  describe('Complex Scenarios', () => {
    test('should handle multiple matches with conflicts', () => {
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
    });
  });

  describe('Data Integrity', () => {
    test('should preserve original data in matched items', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];

      const bankInvests = [
        createInvestItem("2", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "bank"),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(1);
      const matchedItem = result.matchedAtivos[0];
      
      expect(matchedItem.id).toBe("1");
      expect(matchedItem.taxa).toBe("12.5%");
      expect(matchedItem.source).toBe("base");
    });

    test('should use bank data for merged items', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];

      const bankInvests = [
        createInvestItem("2", "CDB Banco ABC", "13.0%", "002", 1000000, 1000000, "2023-01-15", "2024-01-15", 1130000, "bank"),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(1);
      const matchedItem = result.matchedAtivos[0];
      
      expect(matchedItem.valorBruto.getAmount()).toBe(1000000);
      expect(matchedItem.numeroNota).toBe("002");
      expect(matchedItem.valorLiquido.getAmount()).toBe(1130000);
    });
  });

  describe('Overdue Investment Tests', () => {
    test('should mark overdue investments with OVERDUE_DATE EMPTY', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2023-12-31", 1125000, "base"),
      ];

      const bankInvests = [
        createInvestItem("2", "Tesouro Direto", "10.0%", "002", 500000, 500000, "2023-02-20", "2024-02-20", 550000, "bank"),
      ];

      const result = mergeInvests(baseInvests, bankInvests, { compareDate: moment('2024-01-15') });

      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(2);
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      const bankConflict = result.conflicts.find(c => c.source === 'bank');
      
      expect(hasCause(baseConflict, "OVERDUE_DATE", "--")).toBe(true);
      expect(hasCause(baseConflict, "FOUND_REFERENCE", "--")).toBe(true);
      expect(hasCause(bankConflict, "ATIVO_NAME", "UNMATCHED")).toBe(true);
    });

    test('should not mark non-overdue investments as overdue', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-12-31", 1125000, "base"),
      ];

      const bankInvests = [
        createInvestItem("2", "Tesouro Direto", "10.0%", "002", 500000, 500000, "2023-02-20", "2024-02-20", 550000, "bank"),
      ];

      const result = mergeInvests(baseInvests, bankInvests, { compareDate: moment('2024-01-15') });

      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(2);
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      expect(hasCause(baseConflict, "FOUND_REFERENCE", "--")).toBe(true);
      expect(hasCause(baseConflict, "OVERDUE_DATE", "--")).toBe(false);
    });

    test('should mark overdue bank investments with OVERDUE_DATE UNMATCHED', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-12-31", 1125000, "base"),
      ];

      const bankInvests = [
        createInvestItem("2", "Tesouro Direto", "10.0%", "002", 500000, 500000, "2023-02-20", "2023-12-31", 550000, "bank"),
      ];

      const result = mergeInvests(baseInvests, bankInvests, { compareDate: moment('2024-01-15') });

      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(2);
      
      const bankConflict = result.conflicts.find(c => c.source === 'bank');
      expect(hasCause(bankConflict, "ATIVO_NAME", "UNMATCHED")).toBe(true);
      expect(hasCause(bankConflict, "OVERDUE_DATE", "UNMATCHED")).toBe(true);
    });
  });

  describe('FOUND_REFERENCE Tests', () => {
    test('should add FOUND_REFERENCE cause for unmatched base items', () => {
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
      expect(hasCause(baseConflict, "FOUND_REFERENCE", "--")).toBe(true);
    });

    test('should not add FOUND_REFERENCE cause for matched items with partial matches', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];

      const bankInvests = [
        createInvestItem("2", "CDB Banco ABC 2024", "12.5%", "002", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "bank"),
      ];

      const result = mergeInvests(baseInvests, bankInvests);

      expect(result.matchedAtivos).toHaveLength(1);
      expect(result.conflicts).toHaveLength(2);
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      expect(hasCause(baseConflict, "FOUND_REFERENCE", "--")).toBe(false);
      expect(hasCause(baseConflict, "ATIVO_NAME", "PARTIAL_MATCH")).toBe(true);
    });
  });

  describe('Backward Compatibility', () => {
    test('should work without compareDate', () => {
      const baseInvests = [
        createInvestItem("1", "CDB Banco ABC", "12.5%", "001", 1000000, 1000000, "2023-01-15", "2024-01-15", 1125000, "base"),
      ];

      const bankInvests = [
        createInvestItem("2", "Tesouro Direto", "10.0%", "002", 500000, 500000, "2023-02-20", "2024-02-20", 550000, "bank"),
      ];

      const result = mergeInvests(baseInvests, bankInvests, { compareDate: undefined });

      expect(result.matchedAtivos).toHaveLength(0);
      expect(result.conflicts).toHaveLength(2);
      
      const baseConflict = result.conflicts.find(c => c.source === 'base');
      const bankConflict = result.conflicts.find(c => c.source === 'bank');
      
      expect(getPrimaryCause(baseConflict)).toBe("MULTIPLE_CRITERIA_MISSMATCH");
      expect(getPrimaryCause(bankConflict)).toBe("ASSET_NAME_MISSMATCH");
    });
  });
}); 