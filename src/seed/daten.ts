/**
 * Fiktive Seed-Daten für den Prototyp. Keine echten Namen, Sätze oder Kunden.
 * Stichtag: Oktober 2026; Januar–September sind abgeschlossen.
 */
import { monateZwischen } from "@/domain/monat";
import type {
  Abwesenheit,
  Beauftragung,
  Datenbestand,
  Kunde,
  Mitarbeiter,
  Monat,
  Monatswert,
  Partner,
  PartnerRegel,
  Projekt,
  Zuordnung,
} from "@/domain/typen";

export const JAHR = 2026;
export const AKTUELLER_MONAT: Monat = "2026-10";
export const LETZTER_ABSCHLUSS: Monat = "2026-09";

/** deterministischer Zufall (mulberry32), damit der Prototyp stabil bleibt */
function zufall(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const kunden: Kunde[] = [
  { id: "k-a", name: "Kunde A", abc: "A", umsatzziel: { 2026: 900_000_00 }, reiseregel: { art: "pro_tag", cent: 200_00 } },
  { id: "k-b", name: "Kunde B", abc: "A", umsatzziel: { 2026: 650_000_00 }, reiseregel: { art: "pro_monat", cent: 1_500_00 } },
  { id: "k-c", name: "Kunde C", abc: "B", umsatzziel: { 2026: 320_000_00 }, reiseregel: { art: "keine" } },
  { id: "k-d", name: "Kunde D", abc: "B", umsatzziel: { 2026: 250_000_00 }, reiseregel: { art: "pro_tag", cent: 150_00 } },
  { id: "k-e", name: "Kunde E", abc: "C", reiseregel: { art: "keine" } },
  { id: "k-f", name: "Kunde F", abc: "C", umsatzziel: { 2026: 60_000_00 }, reiseregel: { art: "keine" } },
];

const projekte: Projekt[] = [
  { id: "p-a1", kundeId: "k-a", name: "Gesamtbanksteuerung" },
  { id: "p-a2", kundeId: "k-a", name: "Meldewesen" },
  { id: "p-b1", kundeId: "k-b", name: "Kreditprozess" },
  { id: "p-c1", kundeId: "k-c", name: "Risikotragfähigkeit" },
  { id: "p-d1", kundeId: "k-d", name: "Datenhaushalt" },
  { id: "p-e1", kundeId: "k-e", name: "Vorstudie Zahlungsverkehr" },
  { id: "p-f1", kundeId: "k-f", name: "Prüfungsbegleitung" },
];

const tm = { art: "tm" } as const;

const beauftragungen: Beauftragung[] = [
  // Kunde A: quartalsweise Teilbeauftragungen
  { id: "b-a1-q1", projektId: "p-a1", name: "GBS Q1", von: "2026-01", bis: "2026-03", budgetPt100: 120_00, status: "beauftragt", abrechnung: tm },
  { id: "b-a1-q2", projektId: "p-a1", name: "GBS Q2", von: "2026-04", bis: "2026-06", budgetPt100: 120_00, status: "beauftragt", abrechnung: tm, folgeVon: "b-a1-q1" },
  { id: "b-a1-q3", projektId: "p-a1", name: "GBS Q3", von: "2026-07", bis: "2026-09", budgetPt100: 110_00, status: "beauftragt", abrechnung: tm, folgeVon: "b-a1-q2" },
  { id: "b-a1-q4", projektId: "p-a1", name: "GBS Q4", von: "2026-10", bis: "2026-12", budgetPt100: 120_00, status: "erwartet", wahrscheinlichkeitBp: 8_000, abrechnung: tm, folgeVon: "b-a1-q3" },
  { id: "b-a2", projektId: "p-a2", name: "Meldewesen 2026", von: "2026-03", bis: "2026-12", budgetPt100: 160_00, status: "beauftragt", abrechnung: tm },
  { id: "b-b1", projektId: "p-b1", name: "Kreditprozess Umsetzung", von: "2026-01", bis: "2026-12", budgetPt100: 380_00, status: "beauftragt", abrechnung: tm },
  { id: "b-b1-opt", projektId: "p-b1", name: "Kreditprozess Rollout (Option)", von: "2026-11", bis: "2026-12", budgetPt100: 40_00, status: "option", abrechnung: tm },
  { id: "b-c1", projektId: "p-c1", name: "RTF Überarbeitung", von: "2026-02", bis: "2026-11", budgetPt100: 200_00, status: "beauftragt", abrechnung: tm },
  { id: "b-d1", projektId: "p-d1", name: "Datenhaushalt Phase 1", von: "2026-05", bis: "2026-10", budgetPt100: 90_00, status: "beauftragt", abrechnung: { art: "festpreis", festpreisCent: 110_000_00 } },
  { id: "b-d2", projektId: "p-d1", name: "Datenhaushalt Phase 2", von: "2026-11", bis: "2026-12", budgetPt100: 40_00, status: "erwartet", wahrscheinlichkeitBp: 5_000, abrechnung: tm },
  { id: "b-e1", projektId: "p-e1", name: "Vorstudie", von: "2026-10", bis: "2026-12", budgetPt100: 30_00, status: "erwartet", wahrscheinlichkeitBp: 3_000, abrechnung: tm },
  { id: "b-f1", projektId: "p-f1", name: "Prüfungsbegleitung", von: "2026-04", bis: "2026-07", budgetPt100: 45_00, status: "beauftragt", abrechnung: tm },
];

const mitarbeiter: Mitarbeiter[] = [
  { id: "m-1", kuerzel: "MA1", name: "MA 1", extern: false, teilzeitBp: 10_000 },
  { id: "m-2", kuerzel: "MA2", name: "MA 2", extern: false, teilzeitBp: 10_000 },
  { id: "m-3", kuerzel: "MA3", name: "MA 3", extern: false, teilzeitBp: 8_000 },
  { id: "m-4", kuerzel: "MA4", name: "MA 4", extern: false, teilzeitBp: 10_000 },
  { id: "m-5", kuerzel: "MA5", name: "MA 5", extern: false, teilzeitBp: 10_000 },
  { id: "m-6", kuerzel: "MA6", name: "MA 6", extern: false, teilzeitBp: 6_000 },
  { id: "m-7", kuerzel: "EX1", name: "Extern 1", extern: true, einkaufssatzCent: 850_00, teilzeitBp: 10_000 },
  { id: "m-8", kuerzel: "EX2", name: "Extern 2", extern: true, einkaufssatzCent: 900_00, teilzeitBp: 10_000 },
];

/** [Zuordnung, Plan-PT pro Monat] – Sätze fiktiv und gerundet */
const zuordnungsPlan: [Zuordnung, number][] = [
  [{ id: "z-1", beauftragungId: "b-a1-q1", maId: "m-1", vkSatzCent: 1_350_00 }, 18],
  [{ id: "z-2", beauftragungId: "b-a1-q1", maId: "m-2", vkSatzCent: 1_150_00 }, 16],
  [{ id: "z-3", beauftragungId: "b-a1-q1", maId: "m-7", vkSatzCent: 1_250_00 }, 6],
  [{ id: "z-4", beauftragungId: "b-a1-q2", maId: "m-1", vkSatzCent: 1_350_00 }, 18],
  [{ id: "z-5", beauftragungId: "b-a1-q2", maId: "m-2", vkSatzCent: 1_150_00 }, 16],
  [{ id: "z-6", beauftragungId: "b-a1-q2", maId: "m-7", vkSatzCent: 1_250_00 }, 6],
  [{ id: "z-7", beauftragungId: "b-a1-q3", maId: "m-1", vkSatzCent: 1_400_00 }, 16],
  [{ id: "z-8", beauftragungId: "b-a1-q3", maId: "m-2", vkSatzCent: 1_200_00 }, 15],
  [{ id: "z-9", beauftragungId: "b-a1-q3", maId: "m-7", vkSatzCent: 1_250_00 }, 6],
  [{ id: "z-10", beauftragungId: "b-a1-q4", maId: "m-1", vkSatzCent: 1_400_00 }, 18],
  [{ id: "z-11", beauftragungId: "b-a1-q4", maId: "m-2", vkSatzCent: 1_200_00 }, 16],
  [{ id: "z-12", beauftragungId: "b-a1-q4", maId: "m-7", vkSatzCent: 1_250_00 }, 6],
  [{ id: "z-13", beauftragungId: "b-a2", maId: "m-3", vkSatzCent: 1_100_00 }, 10],
  [{ id: "z-14", beauftragungId: "b-a2", maId: "m-5", vkSatzCent: 1_050_00, reiseOverride: { art: "keine" } }, 6],
  [{ id: "z-15", beauftragungId: "b-b1", maId: "m-4", vkSatzCent: 1_200_00 }, 17],
  [{ id: "z-16", beauftragungId: "b-b1", maId: "m-5", vkSatzCent: 1_050_00 }, 9],
  [{ id: "z-17", beauftragungId: "b-b1", maId: "m-8", vkSatzCent: 1_300_00 }, 6],
  [{ id: "z-18", beauftragungId: "b-b1-opt", maId: "m-4", vkSatzCent: 1_200_00 }, 6],
  [{ id: "z-19", beauftragungId: "b-b1-opt", maId: "m-8", vkSatzCent: 1_300_00 }, 14],
  [{ id: "z-20", beauftragungId: "b-c1", maId: "m-3", vkSatzCent: 1_150_00 }, 4],
  [{ id: "z-21", beauftragungId: "b-c1", maId: "m-6", vkSatzCent: 1_100_00 }, 6],
  [{ id: "z-22", beauftragungId: "b-c1", maId: "m-8", vkSatzCent: 1_250_00 }, 8],
  [{ id: "z-23", beauftragungId: "b-d1", maId: "m-5", vkSatzCent: 0 }, 4],
  [{ id: "z-24", beauftragungId: "b-d1", maId: "m-6", vkSatzCent: 0 }, 2],
  [{ id: "z-25", beauftragungId: "b-d1", maId: "m-7", vkSatzCent: 0 }, 9],
  [{ id: "z-26", beauftragungId: "b-d2", maId: "m-5", vkSatzCent: 1_100_00 }, 10],
  [{ id: "z-27", beauftragungId: "b-d2", maId: "m-7", vkSatzCent: 1_200_00 }, 10],
  [{ id: "z-28", beauftragungId: "b-e1", maId: "m-2", vkSatzCent: 1_150_00 }, 5],
  [{ id: "z-29", beauftragungId: "b-e1", maId: "m-6", vkSatzCent: 1_100_00 }, 5],
  [{ id: "z-30", beauftragungId: "b-f1", maId: "m-4", vkSatzCent: 1_100_00 }, 3],
  [{ id: "z-31", beauftragungId: "b-f1", maId: "m-6", vkSatzCent: 1_000_00 }, 5],
];

/** Urlaubsmonate werden schwächer geplant */
const SAISON: Record<string, number> = { "04": 0.85, "08": 0.5, "12": 0.7 };

function erzeugeMonatswerte(): Monatswert[] {
  const rnd = zufall(42);
  const nachId = new Map(beauftragungen.map((b) => [b.id, b]));
  const werte: Monatswert[] = [];
  for (const [z, ptJeMonat] of zuordnungsPlan) {
    const b = nachId.get(z.beauftragungId)!;
    for (const mon of monateZwischen(b.von, b.bis)) {
      const planPt100 = Math.round(ptJeMonat * (SAISON[mon.slice(5)] ?? 1) * 2) * 50;
      if (mon <= LETZTER_ABSCHLUSS) {
        // Ist weicht um bis zu ±20 % ab, in halben PT
        const abwPt100 = Math.round((rnd() - 0.55) * 0.4 * planPt100 / 50) * 50;
        werte.push({ zuordnungId: z.id, monat: mon, planPt100, istPt100: Math.max(0, planPt100 + abwPt100), status: "abgeschlossen" });
      } else {
        werte.push({ zuordnungId: z.id, monat: mon, planPt100, status: "offen" });
      }
    }
  }
  return werte;
}

function erzeugeAbwesenheiten(): Abwesenheit[] {
  const result: Abwesenheit[] = [];
  for (const ma of mitarbeiter.filter((m) => !m.extern)) {
    result.push({ maId: ma.id, monat: "2026-08", pt100: 10_00 });
    result.push({ maId: ma.id, monat: "2026-12", pt100: 6_00 });
    result.push({ maId: ma.id, monat: "2026-04", pt100: 3_00 });
  }
  result.push({ maId: "m-2", monat: "2026-11", pt100: 5_00 });
  return result;
}

const partner: Partner[] = [
  { id: "x-1", name: "Partner X" },
  { id: "x-2", name: "Partner Y" },
  { id: "x-3", name: "Partner Z" },
];

const partnerRegeln: PartnerRegel[] = [
  { id: "r-1", partnerId: "x-1", bezug: { typ: "kunde", id: "k-a" }, art: { typ: "prozent", bp: 1_000 }, basis: "ohne_reise", gueltigVon: "2026-01" },
  { id: "r-2", partnerId: "x-2", bezug: { typ: "projekt", id: "p-b1" }, art: { typ: "fix_pro_pt", cent: 80_00 }, basis: "ohne_reise", gueltigVon: "2026-01" },
  { id: "r-3", partnerId: "x-2", bezug: { typ: "kunde", id: "k-c" }, art: { typ: "pauschale_monat", cent: 2_500_00 }, basis: "ohne_reise", gueltigVon: "2026-01", gueltigBis: "2026-12" },
  { id: "r-4", partnerId: "x-3", bezug: { typ: "beauftragung", id: "b-d1" }, art: { typ: "pauschale_beauftragung", cent: 8_000_00 }, basis: "ohne_reise", gueltigVon: "2026-01" },
  { id: "r-5", partnerId: "x-3", bezug: { typ: "kunde", id: "k-d" }, art: { typ: "prozent", bp: 500 }, basis: "mit_reise", gueltigVon: "2026-07" },
];

export const seed: Datenbestand = {
  kunden,
  projekte,
  beauftragungen,
  mitarbeiter,
  zuordnungen: zuordnungsPlan.map(([z]) => z),
  monatswerte: erzeugeMonatswerte(),
  abwesenheiten: erzeugeAbwesenheiten(),
  partner,
  partnerRegeln,
};
