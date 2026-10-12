import { describe, expect, it } from "vitest";
import {
  erzeugeFolgebeauftragung,
  Fachfehler,
  legeZuordnungAn,
  loescheBeauftragung,
  loescheKunde,
  loescheMitarbeiter,
  loescheZuordnung,
  speichereBeauftragung,
  speichereKunde,
  speichereMitarbeiter,
} from "./stammdaten";
import { fixture } from "./test-fixture";

const ids = () => {
  let n = 0;
  return () => `neu-${++n}`;
};

describe("Kunde", () => {
  it("anlegen und Namensdublette ablehnen", () => {
    const db = speichereKunde(fixture(), { id: "k9", name: "Kunde Z", abc: "C", reiseregel: { art: "keine" } });
    expect(db.kunden).toHaveLength(3);
    expect(() => speichereKunde(db, { id: "k10", name: "kunde z", abc: "C", reiseregel: { art: "keine" } })).toThrow(Fachfehler);
  });
  it("Löschen nur ohne Projekte", () => {
    expect(() => loescheKunde(fixture(), "k1")).toThrow(/Projekte/);
  });
});

describe("Beauftragung", () => {
  it("Zeitraum prüfen", () => {
    const b = fixture().beauftragungen[0]!;
    expect(() => speichereBeauftragung(fixture(), { ...b, von: "2026-07", bis: "2026-06" })).toThrow(Fachfehler);
  });
  it("Verkürzen entfernt offene Monate, blockiert bei abgeschlossenen", () => {
    const b = fixture().beauftragungen[0]!;
    const db = speichereBeauftragung(fixture(), { ...b, bis: "2026-01" });
    expect(db.monatswerte.some((mw) => mw.zuordnungId === "z1" && mw.monat === "2026-02")).toBe(false);
    expect(() => speichereBeauftragung(fixture(), { ...b, von: "2026-02" })).toThrow(/abgeschlossene/);
  });
  it("Wahrscheinlichkeit entfällt außerhalb von „erwartet“", () => {
    const b = fixture().beauftragungen[1]!;
    const db = speichereBeauftragung(fixture(), { ...b, status: "beauftragt" });
    expect(db.beauftragungen[1]!.wahrscheinlichkeitBp).toBeUndefined();
  });
  it("Löschen nur ohne abgeschlossene Monate, räumt Zuordnungen ab", () => {
    expect(() => loescheBeauftragung(fixture(), "b1")).toThrow(Fachfehler);
    const db = loescheBeauftragung(fixture(), "b2");
    expect(db.zuordnungen.some((z) => z.beauftragungId === "b2")).toBe(false);
    expect(db.monatswerte.some((mw) => mw.zuordnungId === "z3")).toBe(false);
  });
});

describe("Folgebeauftragung", () => {
  it("schließt direkt an, Status erwartet, übernimmt Zuordnungen und Plan", () => {
    const { db, id } = erzeugeFolgebeauftragung(fixture(), "b1", ids());
    const f = db.beauftragungen.find((b) => b.id === id)!;
    expect(f).toMatchObject({ von: "2026-07", bis: "2026-12", status: "erwartet", wahrscheinlichkeitBp: 5_000, folgeVon: "b1", budgetPt100: 60_00 });
    const zs = db.zuordnungen.filter((z) => z.beauftragungId === id);
    expect(zs.map((z) => z.vkSatzCent)).toEqual([1_000_00, 1_200_00]);
    const werte = db.monatswerte.filter((mw) => zs.some((z) => z.id === mw.zuordnungId));
    expect(werte.map((w) => [w.monat, w.planPt100, w.status])).toEqual([
      ["2026-07", 10_00, "offen"],
      ["2026-08", 10_00, "offen"],
      ["2026-07", 5_00, "offen"],
    ]);
  });
});

describe("Mitarbeiter und Zuordnung", () => {
  it("Extern braucht Einkaufssatz, Kürzel eindeutig", () => {
    const db = fixture();
    expect(() => speichereMitarbeiter(db, { id: "m9", kuerzel: "EX9", name: "Extern 9", extern: true, teilzeitBp: 10_000 })).toThrow(/Einkauf/);
    expect(() => speichereMitarbeiter(db, { id: "m9", kuerzel: "ma1", name: "MA 9", extern: false, teilzeitBp: 10_000 })).toThrow(/Kürzel/);
  });
  it("Löschen nur ohne Zuordnungen", () => {
    expect(() => loescheMitarbeiter(fixture(), "m1")).toThrow(Fachfehler);
  });
  it("Zuordnung: Doppelte ablehnen, Verteilung ab erstem offenen Monat", () => {
    expect(() => legeZuordnungAn(fixture(), { id: "z9", beauftragungId: "b1", maId: "m1", vkSatzCent: 1 }, 10_00, "2026-01")).toThrow(/bereits/);
    let db = speichereMitarbeiter(fixture(), { id: "m3", kuerzel: "MA3", name: "MA 3", extern: false, teilzeitBp: 10_000 });
    db = legeZuordnungAn(db, { id: "z9", beauftragungId: "b1", maId: "m3", vkSatzCent: 900_00 }, 10_00, "2026-01");
    const werte = db.monatswerte.filter((mw) => mw.zuordnungId === "z9");
    expect(werte.map((w) => w.monat)).toEqual(["2026-02", "2026-03", "2026-04", "2026-05", "2026-06"]);
    expect(werte.reduce((s, w) => s + w.planPt100, 0)).toBe(10_00);
  });
  it("Zuordnung mit abgeschlossenen Monaten nicht löschbar", () => {
    expect(() => loescheZuordnung(fixture(), "z1")).toThrow(Fachfehler);
    expect(loescheZuordnung(fixture(), "z3").zuordnungen.some((z) => z.id === "z3")).toBe(false);
  });
});
