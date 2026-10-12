import { describe, expect, it } from "vitest";
import { fixture } from "./test-fixture";
import { berechneZeilen, reisekosten } from "./umsatz";

const zeile = (basis: "plan" | "ist" | "gueltig", zuordnungId: string, monat: string) =>
  berechneZeilen(fixture(), basis).find((z) => z.zuordnungId === zuordnungId && z.monat === monat)!;

describe("Umsatz", () => {
  it("abgeschlossener Monat nutzt Ist, Reisetage übersteuern PT", () => {
    const z = zeile("gueltig", "z1", "2026-01");
    expect(z.pt100).toBe(8_50);
    expect(z.ptUmsatzCent).toBe(8_500_00);
    expect(z.reiseCent).toBe(800_00); // 4 Reisetage × 200 €
  });
  it("Plan bleibt in Planbasis erhalten", () => {
    expect(zeile("plan", "z1", "2026-01").ptUmsatzCent).toBe(10_000_00);
  });
  it("offener Monat nutzt Plan, Reisetage = PT", () => {
    const z = zeile("gueltig", "z1", "2026-02");
    expect(z.ptUmsatzCent).toBe(10_000_00);
    expect(z.reiseCent).toBe(2_000_00);
  });
  it("Satz je Zuordnung, Reise-Übersteuerung, Einkauf extern", () => {
    const z = zeile("gueltig", "z2", "2026-01");
    expect(z.ptUmsatzCent).toBe(6_000_00);
    expect(z.reiseCent).toBe(0);
    expect(z.einkaufCent).toBe(4_000_00);
    expect(zeile("gueltig", "z1", "2026-01").einkaufCent).toBe(0);
  });
  it("Festpreis nach Leistungsfortschritt", () => {
    // 2,5 von 10 PT eines Festpreises von 20.000 €
    expect(zeile("gueltig", "z4", "2026-03").ptUmsatzCent).toBe(5_000_00);
  });
  it("Ist-Basis ohne Ist = 0", () => {
    expect(zeile("ist", "z1", "2026-02").pt100).toBe(0);
  });
});

describe("Reisekostenregeln", () => {
  it("pro Monat nur bei PT > 0", () => {
    expect(reisekosten({ art: "pro_monat", cent: 500_00 }, 3_00, undefined)).toBe(500_00);
    expect(reisekosten({ art: "pro_monat", cent: 500_00 }, 0, undefined)).toBe(0);
  });
});
