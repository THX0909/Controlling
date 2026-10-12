import { describe, expect, it } from "vitest";
import { auslastung, budget, erzeugeStand } from "./auswertung";
import { dbQuote, durchschnittsSatz, summiere } from "./forecast";
import { fixture } from "./test-fixture";

function stand() {
  const db = fixture();
  db.partnerRegeln = [
    { id: "r", partnerId: "x", bezug: { typ: "kunde", id: "k1" }, art: { typ: "prozent", bp: 1_000 }, basis: "ohne_reise", gueltigVon: "2026-01" },
  ];
  return erzeugeStand(db);
}

describe("Forecast dreistufig", () => {
  const s = stand();
  it("sicher: Ist + beauftragter Plan", () => {
    const k1 = summiere(s.zeilen, s.posten, "sicher", { kundeId: "k1" });
    // Jan Ist 8.500 + 6.000, Feb Plan 10.000; Reise 800 + 2.000
    expect(k1.ptUmsatzCent).toBe(24_500_00);
    expect(k1.reiseCent).toBe(2_800_00);
    expect(k1.umsatzCent).toBe(27_300_00);
    expect(k1.partnerCent).toBe(2_450_00);
    expect(k1.einkaufCent).toBe(4_000_00);
    expect(k1.dbCent).toBe(20_850_00);
  });
  it("gewichtet: erwartet × Wahrscheinlichkeit", () => {
    const k1 = summiere(s.zeilen, s.posten, "gewichtet", { kundeId: "k1" });
    // + 50 % von 11.000 Umsatz + 2.000 Reise, Partner + 50 % von 1.100
    expect(k1.umsatzCent).toBe(27_300_00 + 6_500_00);
    expect(k1.partnerCent).toBe(2_450_00 + 550_00);
  });
  it("Best Case: inkl. Optionen", () => {
    expect(summiere(s.zeilen, s.posten, "gewichtet", { kundeId: "k2" }).umsatzCent).toBe(0);
    expect(summiere(s.zeilen, s.posten, "best", { kundeId: "k2" }).umsatzCent).toBe(5_000_00);
  });
  it("Ist-Filter trennt abgeschlossene Monate", () => {
    expect(summiere(s.zeilen, s.posten, "sicher", { kundeId: "k1", abgeschlossen: true }).ptUmsatzCent).toBe(14_500_00);
  });
  it("Kennzahlen", () => {
    const k1 = summiere(s.zeilen, s.posten, "sicher", { kundeId: "k1" });
    expect(dbQuote(k1)).toBe(7_637); // 20.850 / 27.300
    expect(durchschnittsSatz(k1)).toBe(1_042_55); // 24.500 € / 23,5 PT = 1.042,553… €
  });
});

describe("Auslastung und Budget", () => {
  const s = stand();
  it("Auslastung mit Abwesenheit, Filter erwartet", () => {
    // Jan: 20 AT − 5 Abwesenheit = 15 PT, Ist 8,5
    expect(auslastung(s, "m1", "2026-01", "beauftragt")).toEqual({ pt100: 8_50, kapazitaetPt100: 15_00, quoteBp: 5_667 });
    expect(auslastung(s, "m1", "2026-07", "beauftragt").pt100).toBe(0);
    expect(auslastung(s, "m1", "2026-07", "inkl_erwartet").pt100).toBe(10_00);
  });
  it("Budgetverbrauch und Reichweite", () => {
    const b = budget(s, s.index.beauftragung.get("b1")!);
    expect(b.verbrauchtPt100).toBe(13_50);
    expect(b.geplantPt100).toBe(10_00);
    expect(b.freiPt100).toBe(36_50);
    expect(b.verbrauchBp).toBe(2_250);
    expect(b.reichweiteMonate).toBe(3); // 46,5 Rest / 13,5 je Monat
  });
});
