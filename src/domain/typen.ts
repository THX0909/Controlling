/**
 * Fachliche Typen. Alle Zahlen sind Integer:
 * - Cent: Geldbetrag in Euro-Cent
 * - Pt100: Personentage in Hundertstel (1 PT = 100)
 * - Bp: Basispunkte (100 % = 10_000)
 * - Monat: "YYYY-MM"
 */
export type Cent = number;
export type Pt100 = number;
export type Bp = number;
export type Monat = string;

export type Abc = "A" | "B" | "C";

export type Reiseregel =
  | { art: "keine" }
  | { art: "pro_tag"; cent: Cent }
  | { art: "pro_monat"; cent: Cent };

export interface Kunde {
  id: string;
  name: string;
  abc: Abc;
  /** Umsatzziel je Jahr, z.B. { 2026: 50_000_00 } */
  umsatzziel?: Record<number, Cent>;
  reiseregel: Reiseregel;
}

export interface Projekt {
  id: string;
  kundeId: string;
  name: string;
}

export type BeauftragungStatus = "beauftragt" | "erwartet" | "option";

export type Abrechnung = { art: "tm" } | { art: "festpreis"; festpreisCent: Cent };

export interface Beauftragung {
  id: string;
  projektId: string;
  name: string;
  von: Monat;
  bis: Monat;
  budgetPt100: Pt100;
  status: BeauftragungStatus;
  /** nur bei Status "erwartet" relevant */
  wahrscheinlichkeitBp?: Bp;
  abrechnung: Abrechnung;
  folgeVon?: string;
}

export interface Mitarbeiter {
  id: string;
  kuerzel: string;
  name: string;
  extern: boolean;
  /** nur extern */
  einkaufssatzCent?: Cent;
  /** 10_000 = Vollzeit */
  teilzeitBp: Bp;
}

export interface Zuordnung {
  id: string;
  beauftragungId: string;
  maId: string;
  vkSatzCent: Cent;
  reiseOverride?: Reiseregel;
}

export type MonatStatus = "offen" | "abgeschlossen";

export interface Monatswert {
  zuordnungId: string;
  monat: Monat;
  planPt100: Pt100;
  istPt100?: Pt100;
  /** Reisetage; ohne Angabe = PT des Monats */
  reisetagePt100?: Pt100;
  status: MonatStatus;
}

export interface Abwesenheit {
  maId: string;
  monat: Monat;
  /** Urlaub + interne Zeit */
  pt100: Pt100;
}

export interface Partner {
  id: string;
  name: string;
}

export type PartnerBezug = { typ: "kunde" | "projekt" | "beauftragung"; id: string };

export type PartnerArt =
  | { typ: "prozent"; bp: Bp }
  | { typ: "fix_pro_pt"; cent: Cent }
  | { typ: "pauschale_monat"; cent: Cent }
  | { typ: "pauschale_beauftragung"; cent: Cent };

export interface PartnerRegel {
  id: string;
  partnerId: string;
  bezug: PartnerBezug;
  art: PartnerArt;
  basis: "mit_reise" | "ohne_reise";
  gueltigVon: Monat;
  gueltigBis?: Monat;
}

export interface Datenbestand {
  kunden: Kunde[];
  projekte: Projekt[];
  beauftragungen: Beauftragung[];
  mitarbeiter: Mitarbeiter[];
  zuordnungen: Zuordnung[];
  monatswerte: Monatswert[];
  abwesenheiten: Abwesenheit[];
  partner: Partner[];
  partnerRegeln: PartnerRegel[];
}

/**
 * Welche PT gelten:
 * - plan: immer Plan-PT
 * - ist: nur Ist-PT (fehlend = 0)
 * - gueltig: abgeschlossene Monate Ist, sonst Plan
 */
export type Wertbasis = "plan" | "ist" | "gueltig";
