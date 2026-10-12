import { describe, expect, it } from "vitest";
import { anteil, ptMalSatz, quoteBp, teileGerundet } from "./zahl";

describe("teileGerundet", () => {
  it("rundet kaufmännisch, auch negativ", () => {
    expect(teileGerundet(5, 2)).toBe(3);
    expect(teileGerundet(4, 2)).toBe(2);
    expect(teileGerundet(-5, 2)).toBe(-3);
    expect(teileGerundet(149, 100)).toBe(1);
    expect(teileGerundet(150, 100)).toBe(2);
    expect(teileGerundet(0, 7)).toBe(0);
  });
  it("lehnt Nicht-Integer und Division durch 0 ab", () => {
    expect(() => teileGerundet(1.5, 2)).toThrow();
    expect(() => teileGerundet(1, 0)).toThrow();
  });
});

describe("Geldrechnung", () => {
  it("PT × Satz exakt in Cent", () => {
    expect(ptMalSatz(1_50, 1_234_56)).toBe(1_851_84);
    expect(ptMalSatz(33, 1_000_01)).toBe(330_00); // 0,33 × 1.000,01 € = 330,0033 €
  });
  it("Anteil in Basispunkten", () => {
    expect(anteil(100_000_00, 1_250)).toBe(12_500_00);
    expect(anteil(1, 5_000)).toBe(1);
  });
  it("Quote", () => {
    expect(quoteBp(1, 3)).toBe(3_333);
    expect(quoteBp(5, 0)).toBeNull();
  });
});
