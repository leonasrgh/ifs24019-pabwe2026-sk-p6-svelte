import { describe, it, expect } from "vitest";
import { typeLabel, typeClass } from "./labels";

describe("labels", () => {
  it("typeLabel should translate known types and fall back for others", () => {
    expect(typeLabel("public")).toBe("Publik");
    expect(typeLabel("unlisted")).toBe("Unlisted");
    expect(typeLabel("private")).toBe("Privat");
    expect(typeLabel("lainnya")).toBe("lainnya");
    expect(typeLabel(null)).toBe("-");
  });

  it("typeClass should return badge classes and fall back to the private style", () => {
    expect(typeClass("public")).toContain("emerald");
    expect(typeClass("unlisted")).toContain("amber");
    expect(typeClass("private")).toContain("slate");
    expect(typeClass("lainnya")).toBe(typeClass("private"));
    expect(typeClass(undefined)).toBe(typeClass("private"));
  });
});
