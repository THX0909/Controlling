import { describe, expect, it } from "vitest";
import { euroFeld, parseEuro, parseProzent, parsePt, ptFeld } from "./eingabe";
import { verteileGleichmaessig } from "./verteilung";

describe("Eingabe-Parser", () => {
  it("Euro im deutschen Format", () => {
    expect(parseEuro("1.234,56")).toBe(123_456);
    expect(parseEuro("1234,5")).toBe(123_450);
    expect(parseEuro("1200")).toBe(120_000);
    expect(parseEuro("1.200 €")).toBe(120_000);
    expect(parseEuro("12.50")).toBe(1_250);
    expect(parseEuro("1,234")).toBeNull();
    expect(parseEuro("abc")).toBeNull();
    expect(parseEuro("")).toBeNull();
    expect(parseEuro("1.23.4")).toBeNull();
  });
  it("PT und Prozent", () => {
    expect(parsePt("12,5")).toBe(12_50);
    expect(parsePt("0,25")).toBe(25);
    expect(parseProzent("80")).toBe(8_000);
    expect(parseProzent("12,5 %")).toBe(1_250);
  });
  it("Rundreise Formularfeld", () => {
    expect(euroFeld(123_450)).toBe("1234,5");
    expect(euroFeld(120_000)).toBe("1200");
    expect(ptFeld(25)).toBe("0,25");
    expect(parseEuro(euroFeld(98_765_43))).toBe(98_765_43);
  });
});

describe("Gleichmäßige Verteilung", () => {
  it("halbe PT, Rest an die ersten Monate", () => {
    const v = verteileGleichmaessig(10_00, ["2026-01", "2026-02", "2026-03"]);
    expect([...v.values()]).toEqual([3_50, 3_50, 3_00]);
  });
  it("Hundertstel, wenn nicht in halben PT teilbar", () => {
    const v = verteileGleichmaessig(1_01, ["a", "b"]);
    expect([...v.values()]).toEqual([51, 50]);
  });
  it("Summe bleibt exakt", () => {
    const v = verteileGleichmaessig(123_45, ["a", "b", "c", "d", "e", "f", "g"]);
    expect([...v.values()].reduce((s, x) => s + x, 0)).toBe(123_45);
  });
  it("leere Monatsliste", () => {
    expect(verteileGleichmaessig(5_00, []).size).toBe(0);
  });
});
