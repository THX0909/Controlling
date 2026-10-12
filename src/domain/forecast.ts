import type { PartnerPosten } from "./partner";
import type { BeauftragungStatus, Bp, Cent, Monat, Pt100 } from "./typen";
import type { Zeile } from "./umsatz";
import { anteil, quoteBp, teileGerundet } from "./zahl";

/**
 * Forecast-Stufen:
 * - sicher:    Ist (abgeschlossen) + Plan beauftragter Beauftragungen
 * - gewichtet: sicher + erwartete × Wahrscheinlichkeit
 * - best:      alles inkl. Optionen zu 100 %
 */
export type Szenario = "sicher" | "gewichtet" | "best";

export function gewicht(
  status: BeauftragungStatus,
  wahrscheinlichkeitBp: Bp,
  abgeschlossen: boolean,
  szenario: Szenario,
): Bp {
  if (abgeschlossen || status === "beauftragt") return 10_000;
  if (szenario === "best") return 10_000;
  if (szenario === "gewichtet" && status === "erwartet") return wahrscheinlichkeitBp;
  return 0;
}

export interface Summen {
  pt100: Pt100;
  ptUmsatzCent: Cent;
  reiseCent: Cent;
  umsatzCent: Cent;
  partnerCent: Cent;
  einkaufCent: Cent;
  dbCent: Cent;
}

export const LEER: Summen = {
  pt100: 0,
  ptUmsatzCent: 0,
  reiseCent: 0,
  umsatzCent: 0,
  partnerCent: 0,
  einkaufCent: 0,
  dbCent: 0,
};

export interface Filter {
  kundeId?: string;
  beauftragungId?: string;
  maId?: string;
  partnerId?: string;
  monate?: readonly Monat[];
  /** true = nur abgeschlossene Monate (Ist), false = nur offene (Forecast) */
  abgeschlossen?: boolean;
}

type Filterbar = Pick<Zeile, "kundeId" | "beauftragungId" | "monat" | "abgeschlossen"> & { maId?: string; partnerId?: string };

function passt(x: Filterbar, f: Filter): boolean {
  return (
    (f.kundeId === undefined || x.kundeId === f.kundeId) &&
    (f.beauftragungId === undefined || x.beauftragungId === f.beauftragungId) &&
    (f.maId === undefined || x.maId === f.maId) &&
    (f.partnerId === undefined || x.partnerId === f.partnerId) &&
    (f.monate === undefined || f.monate.includes(x.monat)) &&
    (f.abgeschlossen === undefined || x.abgeschlossen === f.abgeschlossen)
  );
}

/** Gewichtete Summen für ein Szenario. Umsatz = PT-Umsatz + Reise; DB = Umsatz − Partner − Einkauf. */
export function summiere(
  zeilen: readonly Zeile[],
  posten: readonly PartnerPosten[],
  szenario: Szenario,
  filter: Filter = {},
): Summen {
  const s = { ...LEER };
  for (const z of zeilen) {
    if (!passt(z, filter)) continue;
    const g = gewicht(z.status, z.wahrscheinlichkeitBp, z.abgeschlossen, szenario);
    if (g === 0) continue;
    s.pt100 += anteil(z.pt100, g);
    s.ptUmsatzCent += anteil(z.ptUmsatzCent, g);
    s.reiseCent += anteil(z.reiseCent, g);
    s.einkaufCent += anteil(z.einkaufCent, g);
  }
  // Partnerposten hängen an Beauftragung/Kunde, nicht an MA
  if (filter.maId === undefined) {
    for (const p of posten) {
      if (!passt(p, filter)) continue;
      s.partnerCent += anteil(p.cent, gewicht(p.status, p.wahrscheinlichkeitBp, p.abgeschlossen, szenario));
    }
  }
  s.umsatzCent = s.ptUmsatzCent + s.reiseCent;
  s.dbCent = s.umsatzCent - s.partnerCent - s.einkaufCent;
  return s;
}

/** DB-Quote auf Basis PT-Umsatz + Reise */
export function dbQuote(s: Summen): Bp | null {
  return quoteBp(s.dbCent, s.umsatzCent);
}

/** Ø Tagessatz = PT-Umsatz / PT (ohne Reise), in Cent */
export function durchschnittsSatz(s: Summen): Cent | null {
  if (s.pt100 === 0) return null;
  return teileGerundet(s.ptUmsatzCent * 100, s.pt100);
}
