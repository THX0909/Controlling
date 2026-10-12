import { beauftragungenVonKunde, budget, type Budget, type Stand } from "@/domain/auswertung";
import { summiere, type Summen, type Szenario } from "@/domain/forecast";
import { monateImJahr } from "@/domain/monat";
import type { Beauftragung, Cent, Kunde } from "@/domain/typen";

export const SZENARIEN: { wert: Szenario; text: string }[] = [
  { wert: "sicher", text: "Sicher" },
  { wert: "gewichtet", text: "Gewichtet" },
  { wert: "best", text: "Best Case" },
];

export function leseSzenario(wert: string | string[] | undefined): Szenario {
  return wert === "sicher" || wert === "best" ? wert : "gewichtet";
}

export interface KundenZeile {
  kunde: Kunde;
  zielCent?: Cent;
  /** Umsatz abgeschlossener Monate */
  istCent: Cent;
  /** Jahresumsatz je Stufe (inkl. Ist) */
  sicherCent: Cent;
  gewichtetCent: Cent;
  bestCent: Cent;
  /** Summen im gewählten Szenario */
  summen: Summen;
}

export function kundenSicht(stand: Stand, jahr: number, szenario: Szenario): KundenZeile[] {
  const monate = monateImJahr(jahr);
  return stand.db.kunden.map((kunde) => {
    const f = { kundeId: kunde.id, monate };
    const s = (sz: Szenario) => summiere(stand.zeilen, stand.posten, sz, f);
    return {
      kunde,
      zielCent: kunde.umsatzziel?.[jahr],
      istCent: summiere(stand.zeilen, stand.posten, "sicher", { ...f, abgeschlossen: true }).umsatzCent,
      sicherCent: s("sicher").umsatzCent,
      gewichtetCent: s("gewichtet").umsatzCent,
      bestCent: s("best").umsatzCent,
      summen: s(szenario),
    };
  });
}

export interface BeauftragungsZeile {
  beauftragung: Beauftragung;
  projektName: string;
  kundeName: string;
  budget: Budget;
}

export function beauftragungsSicht(stand: Stand, kundeId?: string): BeauftragungsZeile[] {
  const liste = kundeId ? beauftragungenVonKunde(stand, kundeId) : stand.db.beauftragungen;
  return liste.map((b) => {
    const projekt = stand.index.projekt.get(b.projektId)!;
    return {
      beauftragung: b,
      projektName: projekt.name,
      kundeName: stand.index.kunde.get(projekt.kundeId)!.name,
      budget: budget(stand, b),
    };
  });
}
