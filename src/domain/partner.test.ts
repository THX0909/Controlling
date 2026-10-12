import { describe, expect, it } from "vitest";
import { berechnePartnerkosten } from "./partner";
import { fixture } from "./test-fixture";
import type { PartnerRegel } from "./typen";
import { baueIndex, berechneZeilen } from "./umsatz";

function kosten(regeln: PartnerRegel[]) {
  const db = fixture();
  const index = baueIndex(db);
  return berechnePartnerkosten(berechneZeilen(db, "gueltig", index), regeln, index);
}

const basisRegel = { partnerId: "x", gueltigVon: "2026-01" } as const;

describe("Partnerkosten", () => {
  it("% vom Umsatz ohne Reise, Bezug Kunde", () => {
    const p = kosten([{ ...basisRegel, id: "r", bezug: { typ: "kunde", id: "k1" }, art: { typ: "prozent", bp: 1_000 }, basis: "ohne_reise" }]);
    const jan = p.filter((x) => x.monat === "2026-01").reduce((s, x) => s + x.cent, 0);
    expect(jan).toBe(1_450_00); // 10 % von (8.500 + 6.000)
  });
  it("% vom Umsatz mit Reise", () => {
    const p = kosten([{ ...basisRegel, id: "r", bezug: { typ: "kunde", id: "k1" }, art: { typ: "prozent", bp: 1_000 }, basis: "mit_reise" }]);
    expect(p.filter((x) => x.monat === "2026-01").reduce((s, x) => s + x.cent, 0)).toBe(1_530_00);
  });
  it("fix pro PT, Bezug Beauftragung", () => {
    const p = kosten([{ ...basisRegel, id: "r", bezug: { typ: "beauftragung", id: "b1" }, art: { typ: "fix_pro_pt", cent: 50_00 }, basis: "ohne_reise" }]);
    expect(p.reduce((s, x) => s + x.cent, 0)).toBe(1_175_00); // (8,5 + 5 + 10) × 50 €
  });
  it("Pauschale pro Monat einmal je aktivem Monat", () => {
    const p = kosten([{ ...basisRegel, id: "r", bezug: { typ: "projekt", id: "p1" }, art: { typ: "pauschale_monat", cent: 1_000_00 }, basis: "ohne_reise" }]);
    expect(p.map((x) => x.monat).sort()).toEqual(["2026-01", "2026-02", "2026-07"]);
    // Juli: nur erwartete Beauftragung aktiv → Posten trägt deren Status
    expect(p.find((x) => x.monat === "2026-07")!.status).toBe("erwartet");
  });
  it("Pauschale je Beauftragung einmalig im Startmonat", () => {
    const p = kosten([{ ...basisRegel, id: "r", bezug: { typ: "beauftragung", id: "b1" }, art: { typ: "pauschale_beauftragung", cent: 3_000_00 }, basis: "ohne_reise" }]);
    expect(p).toHaveLength(1);
    expect(p[0]!.monat).toBe("2026-01");
  });
  it("Gültigkeit begrenzt", () => {
    const p = kosten([{ ...basisRegel, id: "r", gueltigVon: "2026-02", gueltigBis: "2026-06", bezug: { typ: "kunde", id: "k1" }, art: { typ: "prozent", bp: 1_000 }, basis: "ohne_reise" }]);
    expect(p.map((x) => x.monat)).toEqual(["2026-02"]);
  });
  it("mehrere Regeln addieren sich", () => {
    const p = kosten([
      { ...basisRegel, id: "r1", bezug: { typ: "kunde", id: "k1" }, art: { typ: "prozent", bp: 1_000 }, basis: "ohne_reise" },
      { ...basisRegel, id: "r2", partnerId: "y", bezug: { typ: "beauftragung", id: "b1" }, art: { typ: "prozent", bp: 500 }, basis: "ohne_reise" },
    ]);
    const jan = p.filter((x) => x.monat === "2026-01");
    expect(jan.filter((x) => x.partnerId === "x").reduce((s, x) => s + x.cent, 0)).toBe(1_450_00);
    expect(jan.filter((x) => x.partnerId === "y").reduce((s, x) => s + x.cent, 0)).toBe(725_00);
  });
});
