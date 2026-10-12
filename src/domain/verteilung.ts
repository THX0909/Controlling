import type { Monat, Pt100 } from "./typen";

/**
 * Verteilt PT gleichmäßig auf Monate. Rastert in halben PT, wenn die Summe das
 * zulässt, sonst in Hundertstel. Rest geht an die ersten Monate.
 * Die Summe bleibt exakt erhalten.
 */
export function verteileGleichmaessig(gesamt: Pt100, monate: readonly Monat[]): Map<Monat, Pt100> {
  const ergebnis = new Map<Monat, Pt100>();
  if (monate.length === 0) return ergebnis;
  if (!Number.isSafeInteger(gesamt) || gesamt < 0) throw new Error(`Ungültige PT-Summe: ${gesamt}`);
  const raster = gesamt % 50 === 0 ? 50 : 1;
  const einheiten = gesamt / raster;
  const basis = Math.floor(einheiten / monate.length);
  const rest = einheiten - basis * monate.length;
  monate.forEach((m, i) => ergebnis.set(m, (basis + (i < rest ? 1 : 0)) * raster));
  return ergebnis;
}
