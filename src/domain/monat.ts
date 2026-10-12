import type { Monat } from "./typen";

export function monat(jahr: number, m: number): Monat {
  return `${jahr}-${String(m).padStart(2, "0")}`;
}

export function zerlege(mon: Monat): { jahr: number; m: number } {
  const [j, m] = mon.split("-").map(Number);
  if (!j || !m || m < 1 || m > 12) throw new Error(`Ungültiger Monat: ${mon}`);
  return { jahr: j, m };
}

export function plusMonate(mon: Monat, n: number): Monat {
  const { jahr, m } = zerlege(mon);
  const idx = jahr * 12 + (m - 1) + n;
  return monat(Math.floor(idx / 12), (idx % 12) + 1);
}

/** inklusive beider Grenzen */
export function monateZwischen(von: Monat, bis: Monat): Monat[] {
  const result: Monat[] = [];
  for (let akt = von; akt <= bis; akt = plusMonate(akt, 1)) result.push(akt);
  return result;
}

export function monateImJahr(jahr: number): Monat[] {
  return monateZwischen(monat(jahr, 1), monat(jahr, 12));
}

export function liegtIn(mon: Monat, von: Monat, bis?: Monat): boolean {
  return mon >= von && (bis === undefined || mon <= bis);
}

const KURZ = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

export function monatKurz(mon: Monat): string {
  return KURZ[zerlege(mon).m - 1]!;
}

export function monatLang(mon: Monat): string {
  const { jahr } = zerlege(mon);
  return `${monatKurz(mon)} ${jahr}`;
}
