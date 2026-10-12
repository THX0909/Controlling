import type {
  Beauftragung,
  BeauftragungStatus,
  Bp,
  Cent,
  Datenbestand,
  Kunde,
  Mitarbeiter,
  Monat,
  Monatswert,
  Projekt,
  Pt100,
  Reiseregel,
  Wertbasis,
  Zuordnung,
} from "./typen";
import { ptMalSatz, teileGerundet } from "./zahl";

/** Eine berechnete Zeile je Zuordnung und Monat (Faktentabelle für alle Auswertungen). */
export interface Zeile {
  zuordnungId: string;
  beauftragungId: string;
  projektId: string;
  kundeId: string;
  maId: string;
  monat: Monat;
  status: BeauftragungStatus;
  wahrscheinlichkeitBp: Bp;
  abgeschlossen: boolean;
  pt100: Pt100;
  ptUmsatzCent: Cent;
  reiseCent: Cent;
  einkaufCent: Cent;
}

export interface Index {
  kunde: Map<string, Kunde>;
  projekt: Map<string, Projekt>;
  beauftragung: Map<string, Beauftragung>;
  ma: Map<string, Mitarbeiter>;
  zuordnung: Map<string, Zuordnung>;
}

const nachId = <T extends { id: string }>(liste: readonly T[]) => new Map(liste.map((x) => [x.id, x]));

export function baueIndex(db: Datenbestand): Index {
  return {
    kunde: nachId(db.kunden),
    projekt: nachId(db.projekte),
    beauftragung: nachId(db.beauftragungen),
    ma: nachId(db.mitarbeiter),
    zuordnung: nachId(db.zuordnungen),
  };
}

function hole<T>(map: Map<string, T>, id: string, was: string): T {
  const x = map.get(id);
  if (!x) throw new Error(`${was} ${id} nicht gefunden`);
  return x;
}

export function ptFuer(mw: Monatswert, basis: Wertbasis): Pt100 {
  switch (basis) {
    case "plan":
      return mw.planPt100;
    case "ist":
      return mw.istPt100 ?? 0;
    case "gueltig":
      return mw.status === "abgeschlossen" ? (mw.istPt100 ?? 0) : mw.planPt100;
  }
}

/** PT-Umsatz: T&M = PT × Satz, Festpreis = Festpreis × PT / Budget (Leistungsfortschritt). */
export function ptUmsatz(pt: Pt100, zuordnung: Zuordnung, beauftragung: Beauftragung): Cent {
  if (beauftragung.abrechnung.art === "festpreis") {
    if (beauftragung.budgetPt100 === 0) return 0;
    return teileGerundet(beauftragung.abrechnung.festpreisCent * pt, beauftragung.budgetPt100);
  }
  return ptMalSatz(pt, zuordnung.vkSatzCent);
}

/** Reisekosten: pro Tag = Reisetage × Pauschale; pro Monat = Pauschale, sobald PT > 0. */
export function reisekosten(regel: Reiseregel, pt: Pt100, reisetage: Pt100 | undefined): Cent {
  switch (regel.art) {
    case "keine":
      return 0;
    case "pro_tag":
      return ptMalSatz(reisetage ?? pt, regel.cent);
    case "pro_monat":
      return pt > 0 ? regel.cent : 0;
  }
}

export function einkauf(pt: Pt100, ma: Mitarbeiter): Cent {
  return ma.extern ? ptMalSatz(pt, ma.einkaufssatzCent ?? 0) : 0;
}

export function berechneZeilen(db: Datenbestand, basis: Wertbasis, index = baueIndex(db)): Zeile[] {
  return db.monatswerte.map((mw) => {
    const z = hole(index.zuordnung, mw.zuordnungId, "Zuordnung");
    const b = hole(index.beauftragung, z.beauftragungId, "Beauftragung");
    const p = hole(index.projekt, b.projektId, "Projekt");
    const k = hole(index.kunde, p.kundeId, "Kunde");
    const ma = hole(index.ma, z.maId, "Mitarbeiter");
    const pt = ptFuer(mw, basis);
    return {
      zuordnungId: z.id,
      beauftragungId: b.id,
      projektId: p.id,
      kundeId: k.id,
      maId: ma.id,
      monat: mw.monat,
      status: b.status,
      wahrscheinlichkeitBp: b.status === "beauftragt" ? 10_000 : (b.wahrscheinlichkeitBp ?? 0),
      abgeschlossen: mw.status === "abgeschlossen",
      pt100: pt,
      ptUmsatzCent: ptUmsatz(pt, z, b),
      reiseCent: reisekosten(z.reiseOverride ?? k.reiseregel, pt, mw.reisetagePt100),
      einkaufCent: einkauf(pt, ma),
    };
  });
}
