import type { Datenbestand } from "./typen";

/** Kleiner, von Hand nachrechenbarer Datenbestand für Unit-Tests. */
export function fixture(): Datenbestand {
  return {
    kunden: [
      { id: "k1", name: "Kunde A", abc: "A", umsatzziel: { 2026: 100_000_00 }, reiseregel: { art: "pro_tag", cent: 200_00 } },
      { id: "k2", name: "Kunde B", abc: "B", reiseregel: { art: "keine" } },
    ],
    projekte: [
      { id: "p1", kundeId: "k1", name: "Projekt A1" },
      { id: "p2", kundeId: "k2", name: "Projekt B1" },
    ],
    beauftragungen: [
      { id: "b1", projektId: "p1", name: "B1", von: "2026-01", bis: "2026-06", budgetPt100: 60_00, status: "beauftragt", abrechnung: { art: "tm" } },
      { id: "b2", projektId: "p1", name: "B2", von: "2026-07", bis: "2026-12", budgetPt100: 40_00, status: "erwartet", wahrscheinlichkeitBp: 5_000, abrechnung: { art: "tm" } },
      { id: "b3", projektId: "p2", name: "B3", von: "2026-01", bis: "2026-12", budgetPt100: 10_00, status: "option", abrechnung: { art: "festpreis", festpreisCent: 20_000_00 } },
    ],
    mitarbeiter: [
      { id: "m1", kuerzel: "MA1", name: "MA 1", extern: false, teilzeitBp: 10_000 },
      { id: "m2", kuerzel: "EX1", name: "Extern 1", extern: true, einkaufssatzCent: 800_00, teilzeitBp: 10_000 },
    ],
    zuordnungen: [
      { id: "z1", beauftragungId: "b1", maId: "m1", vkSatzCent: 1_000_00 },
      { id: "z2", beauftragungId: "b1", maId: "m2", vkSatzCent: 1_200_00, reiseOverride: { art: "keine" } },
      { id: "z3", beauftragungId: "b2", maId: "m1", vkSatzCent: 1_100_00 },
      { id: "z4", beauftragungId: "b3", maId: "m1", vkSatzCent: 0 },
    ],
    monatswerte: [
      { zuordnungId: "z1", monat: "2026-01", planPt100: 10_00, istPt100: 8_50, reisetagePt100: 4_00, status: "abgeschlossen" },
      { zuordnungId: "z1", monat: "2026-02", planPt100: 10_00, status: "offen" },
      { zuordnungId: "z2", monat: "2026-01", planPt100: 5_00, istPt100: 5_00, status: "abgeschlossen" },
      { zuordnungId: "z3", monat: "2026-07", planPt100: 10_00, status: "offen" },
      { zuordnungId: "z4", monat: "2026-03", planPt100: 2_50, status: "offen" },
    ],
    abwesenheiten: [{ maId: "m1", monat: "2026-01", pt100: 5_00 }],
    partner: [{ id: "x", name: "Partner X" }, { id: "y", name: "Partner Y" }],
    partnerRegeln: [],
  };
}
