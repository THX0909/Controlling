import type { Bp, Cent, Pt100 } from "./typen";

/**
 * Parser für Formulareingaben im deutschen Format, ohne Fließkomma.
 * Liefern null bei ungültiger Eingabe.
 */

/** "1.234,56" | "1234,5" | "1234" | "1234.56" (nur bei genau 2 Nachkommastellen) → Ganzzahl mit `stellen` Nachkommastellen */
function parseDezimal(text: string, stellen: number): number | null {
  let t = text.trim().replace(/\s|€|%/g, "");
  if (t === "") return null;
  const negativ = t.startsWith("-");
  if (negativ) t = t.slice(1);
  // Punkt als Dezimaltrenner nur zulassen, wenn kein Komma vorkommt und er nicht wie ein Tausenderpunkt aussieht
  if (!t.includes(",") && /^\d+\.\d{1,2}$/.test(t)) t = t.replace(".", ",");
  if (!/^(\d{1,3}(\.\d{3})+|\d+)(,\d+)?$/.test(t)) return null;
  const [ganz, nachkomma = ""] = t.replace(/\./g, "").split(",");
  if (nachkomma.length > stellen) return null;
  const wert = Number(ganz) * 10 ** stellen + Number(nachkomma.padEnd(stellen, "0") || "0");
  if (!Number.isSafeInteger(wert)) return null;
  return negativ ? -wert : wert;
}

export function parseEuro(text: string): Cent | null {
  return parseDezimal(text, 2);
}

export function parsePt(text: string): Pt100 | null {
  return parseDezimal(text, 2);
}

/** "80" | "12,5" → Basispunkte */
export function parseProzent(text: string): Bp | null {
  return parseDezimal(text, 2);
}

/** Cent → "1234,56" für Formularfelder (ohne Tausenderpunkte) */
export function euroFeld(cent: Cent | undefined): string {
  if (cent === undefined) return "";
  return feld(cent, 2);
}

export function ptFeld(pt: Pt100 | undefined): string {
  if (pt === undefined) return "";
  return feld(pt, 2);
}

export function prozentFeld(bp: Bp | undefined): string {
  if (bp === undefined) return "";
  return feld(bp, 2);
}

function feld(wert: number, stellen: number): string {
  const basis = 10 ** stellen;
  const ganz = Math.trunc(Math.abs(wert) / basis);
  const rest = Math.abs(wert) % basis;
  const vz = wert < 0 ? "-" : "";
  if (rest === 0) return `${vz}${ganz}`;
  return `${vz}${ganz},${String(rest).padStart(stellen, "0").replace(/0+$/, "")}`;
}
