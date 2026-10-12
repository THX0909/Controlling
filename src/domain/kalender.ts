import { zerlege } from "./monat";
import type { Abwesenheit, Mitarbeiter, Monat, Pt100 } from "./typen";
import { teileGerundet } from "./zahl";

/** Ostersonntag (gregorianisch, anonymer Algorithmus nach Meeus/Jones/Butcher) */
export function ostersonntag(jahr: number): Date {
  const a = jahr % 19;
  const b = Math.floor(jahr / 100);
  const c = jahr % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const monatIdx = Math.floor((h + l - 7 * m + 114) / 31);
  const tag = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(jahr, monatIdx - 1, tag));
}

function plusTage(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86_400_000);
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Gesetzliche Feiertage Baden-Württemberg als ISO-Datum → Name */
export function feiertageBW(jahr: number): Map<string, string> {
  const ostern = ostersonntag(jahr);
  const fest = (m: number, t: number) => iso(new Date(Date.UTC(jahr, m - 1, t)));
  return new Map([
    [fest(1, 1), "Neujahr"],
    [fest(1, 6), "Heilige Drei Könige"],
    [iso(plusTage(ostern, -2)), "Karfreitag"],
    [iso(plusTage(ostern, 1)), "Ostermontag"],
    [fest(5, 1), "Tag der Arbeit"],
    [iso(plusTage(ostern, 39)), "Christi Himmelfahrt"],
    [iso(plusTage(ostern, 50)), "Pfingstmontag"],
    [iso(plusTage(ostern, 60)), "Fronleichnam"],
    [fest(10, 3), "Tag der Deutschen Einheit"],
    [fest(11, 1), "Allerheiligen"],
    [fest(12, 25), "1. Weihnachtstag"],
    [fest(12, 26), "2. Weihnachtstag"],
  ]);
}

const feiertagCache = new Map<number, Map<string, string>>();

/** Werktage Mo–Fr ohne Feiertage BW */
export function arbeitstage(mon: Monat): number {
  const { jahr, m } = zerlege(mon);
  let feiertage = feiertagCache.get(jahr);
  if (!feiertage) {
    feiertage = feiertageBW(jahr);
    feiertagCache.set(jahr, feiertage);
  }
  let anzahl = 0;
  for (let d = new Date(Date.UTC(jahr, m - 1, 1)); d.getUTCMonth() === m - 1; d = plusTage(d, 1)) {
    const wt = d.getUTCDay();
    if (wt !== 0 && wt !== 6 && !feiertage.has(iso(d))) anzahl++;
  }
  return anzahl;
}

/** Kapazität = Arbeitstage × Teilzeitfaktor − Abwesenheit (min. 0) */
export function kapazitaet(ma: Mitarbeiter, mon: Monat, abwesenheiten: readonly Abwesenheit[]): Pt100 {
  const brutto = teileGerundet(arbeitstage(mon) * 100 * ma.teilzeitBp, 10_000);
  const abwesend = abwesenheiten
    .filter((a) => a.maId === ma.id && a.monat === mon)
    .reduce((s, a) => s + a.pt100, 0);
  return Math.max(0, brutto - abwesend);
}
