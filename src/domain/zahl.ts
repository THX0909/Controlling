import type { Bp, Cent, Pt100 } from "./typen";

/** Kaufmännisch runden (half away from zero) einer Division ganzer Zahlen. */
export function teileGerundet(zaehler: number, nenner: number): number {
  if (!Number.isInteger(zaehler) || !Number.isInteger(nenner) || nenner === 0) {
    throw new Error(`Ungültige Division ${zaehler} / ${nenner}`);
  }
  const vorzeichen = Math.sign(zaehler) * Math.sign(nenner);
  const z = Math.abs(zaehler);
  const n = Math.abs(nenner);
  const q = Math.floor(z / n);
  const rest = z - q * n;
  const ergebnis = rest * 2 >= n ? q + 1 : q;
  return vorzeichen * ergebnis || 0;
}

function pruefeSicher(wert: number): number {
  if (!Number.isSafeInteger(wert)) throw new Error(`Zahl außerhalb des sicheren Bereichs: ${wert}`);
  return wert;
}

/** PT × Satz → Cent */
export function ptMalSatz(pt: Pt100, satz: Cent): Cent {
  return teileGerundet(pruefeSicher(pt * satz), 100);
}

/** Betrag × Basispunkte → Cent */
export function anteil(betrag: Cent, bp: Bp): Cent {
  return teileGerundet(pruefeSicher(betrag * bp), 10_000);
}

/** Quote a/b in Basispunkten; b = 0 → null */
export function quoteBp(a: number, b: number): Bp | null {
  if (b === 0) return null;
  return teileGerundet(pruefeSicher(a * 10_000), b);
}

export const summe = (werte: readonly number[]): number => werte.reduce((s, w) => s + w, 0);

const eurFormat = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const ptFormat = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** 123456 Cent → "1.235 €" (für Übersichten volle Euro) */
export function formatEuro(cent: Cent): string {
  return `${eurFormat.format(teileGerundet(cent, 100))} €`;
}

/** Kompakt: 1.234.567 € → "1,23 Mio €", 45.600 € → "45,6 T€" */
export function formatEuroKurz(cent: Cent): string {
  const euro = cent / 100;
  const abs = Math.abs(euro);
  if (abs >= 1_000_000) return `${(euro / 1_000_000).toLocaleString("de-DE", { maximumFractionDigits: 2 })} Mio €`;
  if (abs >= 10_000) return `${(euro / 1_000).toLocaleString("de-DE", { maximumFractionDigits: 1 })} T€`;
  return formatEuro(cent);
}

export function formatPt(pt: Pt100): string {
  return ptFormat.format(pt / 100);
}

export function formatProzent(bp: Bp | null, nachkomma = 0): string {
  if (bp === null) return "–";
  return `${(bp / 100).toLocaleString("de-DE", { minimumFractionDigits: nachkomma, maximumFractionDigits: nachkomma })} %`;
}
