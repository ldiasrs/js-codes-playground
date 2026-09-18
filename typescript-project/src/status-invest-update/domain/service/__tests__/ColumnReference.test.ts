import { Column } from "../../model/Column";
import { ColumnReference } from "../ColumnReference";

const columns = (...ids: string[]): Column[] => ids.map((id) => ({ id, kind: "money" }));

describe("ColumnReference", () => {
  it("maps column positions to A1 letters", () => {
    const reference = new ColumnReference(columns("first", "second", "third"));

    expect(reference.letter("first")).toBe("A");
    expect(reference.letter("third")).toBe("C");
  });

  it("keeps counting past the end of the alphabet", () => {
    const ids = Array.from({ length: 28 }, (_, index) => `c${index}`);

    const reference = new ColumnReference(columns(...ids));

    expect(reference.letter("c25")).toBe("Z");
    expect(reference.letter("c26")).toBe("AA");
    expect(reference.letter("c27")).toBe("AB");
  });

  it("builds cell and open-ended data references", () => {
    const reference = new ColumnReference(columns("first", "second"));

    expect(reference.cell("second", 7)).toBe("B7");
    expect(reference.dataRange("second")).toBe("B2:B");
  });

  it("refuses to reference a column that is not there", () => {
    const reference = new ColumnReference(columns("first"));

    expect(() => reference.letter("missing")).toThrow('no column "missing"');
  });
});
