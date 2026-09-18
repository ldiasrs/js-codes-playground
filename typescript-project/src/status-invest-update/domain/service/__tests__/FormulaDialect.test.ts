import { FormulaDialect } from "../FormulaDialect";

describe("FormulaDialect", () => {
  const dialect = new FormulaDialect();

  it("separates arguments the way a Brazilian-locale sheet expects", () => {
    expect(dialect.call("IFERROR", "A1/B1", '""')).toBe('IFERROR(A1/B1; "")');
    expect(dialect.date(new Date(2026, 8, 17))).toBe("DATE(2026; 9; 17)");
  });

  it("wraps expressions so an error or an empty dependency reads as blank", () => {
    expect(dialect.orBlank("A1/B1")).toBe('IFERROR(A1/B1; "")');
    expect(dialect.whenPresent("H2", "H2+1")).toBe('IF(H2=""; ""; H2+1)');
  });

  it("takes another separator for a sheet that wants commas", () => {
    expect(new FormulaDialect(", ").call("SUM", "A1", "B1")).toBe("SUM(A1, B1)");
  });
});
