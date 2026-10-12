import { describe, expect, it } from "vitest";
import { erzeugeStand } from "@/domain/auswertung";
import { seed } from "./daten";

describe("Seed-Daten", () => {
  it("sind referenziell konsistent und berechenbar", () => {
    expect(() => erzeugeStand(seed)).not.toThrow();
  });
  it("enthalten nur fiktive Bezeichnungen", () => {
    for (const k of seed.kunden) expect(k.name).toMatch(/^Kunde [A-Z]$/);
    for (const p of seed.partner) expect(p.name).toMatch(/^Partner [A-Z]$/);
    for (const m of seed.mitarbeiter) expect(m.name).toMatch(/^(MA|Extern) \d+$/);
  });
  it("Planwerte sind Vielfache von 0,5 PT", () => {
    for (const mw of seed.monatswerte) {
      expect(mw.planPt100 % 50).toBe(0);
      if (mw.istPt100 !== undefined) expect(mw.istPt100 % 50).toBe(0);
    }
  });
});
