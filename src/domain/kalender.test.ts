import { describe, expect, it } from "vitest";
import { arbeitstage, feiertageBW, kapazitaet, ostersonntag } from "./kalender";
import { monateImJahr } from "./monat";

describe("Feiertage Baden-Württemberg", () => {
  it("Ostersonntag", () => {
    expect(ostersonntag(2024).toISOString().slice(0, 10)).toBe("2024-03-31");
    expect(ostersonntag(2025).toISOString().slice(0, 10)).toBe("2025-04-20");
    expect(ostersonntag(2026).toISOString().slice(0, 10)).toBe("2026-04-05");
  });
  it("bewegliche Feiertage 2026", () => {
    const f = feiertageBW(2026);
    expect(f.get("2026-04-03")).toBe("Karfreitag");
    expect(f.get("2026-05-14")).toBe("Christi Himmelfahrt");
    expect(f.get("2026-05-25")).toBe("Pfingstmontag");
    expect(f.get("2026-06-04")).toBe("Fronleichnam");
    expect(f.size).toBe(12);
  });
  it("Arbeitstage", () => {
    expect(arbeitstage("2026-01")).toBe(20);
    expect(arbeitstage("2026-04")).toBe(20);
    // 261 Werktage − 9 Feiertage an Werktagen
    expect(monateImJahr(2026).reduce((s, m) => s + arbeitstage(m), 0)).toBe(252);
  });
});

describe("Kapazität", () => {
  const ma = { id: "m", kuerzel: "M", name: "M", extern: false, teilzeitBp: 8_000 };
  it("Teilzeit und Abwesenheit", () => {
    expect(kapazitaet(ma, "2026-01", [])).toBe(16_00);
    expect(kapazitaet(ma, "2026-01", [{ maId: "m", monat: "2026-01", pt100: 3_50 }])).toBe(12_50);
  });
  it("nie negativ", () => {
    expect(kapazitaet(ma, "2026-01", [{ maId: "m", monat: "2026-01", pt100: 30_00 }])).toBe(0);
  });
});
