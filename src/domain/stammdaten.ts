import { liegtIn, monateZwischen, plusMonate } from "./monat";
import type { Beauftragung, Bp, Datenbestand, Kunde, Mitarbeiter, Monat, Monatswert, Projekt, Pt100, Zuordnung } from "./typen";
import { verteileGleichmaessig } from "./verteilung";

/**
 * Stammdaten-Operationen als reine Funktionen: Datenbestand rein, neuer Datenbestand raus.
 * Fachliche Verstöße werfen Fachfehler (Meldung für den Nutzer).
 */
export class Fachfehler extends Error {}

function upsert<T extends { id: string }>(liste: readonly T[], eintrag: T): T[] {
  return liste.some((x) => x.id === eintrag.id) ? liste.map((x) => (x.id === eintrag.id ? eintrag : x)) : [...liste, eintrag];
}

function existiert<T extends { id: string }>(liste: readonly T[], id: string, was: string) {
  if (!liste.some((x) => x.id === id)) throw new Fachfehler(`${was} nicht gefunden.`);
}

function istAbgeschlossen(db: Datenbestand, zuordnungIds: Set<string>) {
  return db.monatswerte.some((mw) => zuordnungIds.has(mw.zuordnungId) && mw.status === "abgeschlossen");
}

// ── Kunde ─────────────────────────────────────────────

export function speichereKunde(db: Datenbestand, kunde: Kunde): Datenbestand {
  if (db.kunden.some((k) => k.id !== kunde.id && k.name.toLowerCase() === kunde.name.toLowerCase())) {
    throw new Fachfehler(`Ein Kunde „${kunde.name}“ existiert bereits.`);
  }
  return { ...db, kunden: upsert(db.kunden, kunde) };
}

export function loescheKunde(db: Datenbestand, id: string): Datenbestand {
  existiert(db.kunden, id, "Kunde");
  if (db.projekte.some((p) => p.kundeId === id)) throw new Fachfehler("Kunde hat noch Projekte. Bitte zuerst die Projekte löschen.");
  if (db.partnerRegeln.some((r) => r.bezug.typ === "kunde" && r.bezug.id === id)) {
    throw new Fachfehler("Kunde ist Bezug einer Partnerregel.");
  }
  return { ...db, kunden: db.kunden.filter((k) => k.id !== id) };
}

// ── Projekt ───────────────────────────────────────────

export function speichereProjekt(db: Datenbestand, projekt: Projekt): Datenbestand {
  existiert(db.kunden, projekt.kundeId, "Kunde");
  return { ...db, projekte: upsert(db.projekte, projekt) };
}

export function loescheProjekt(db: Datenbestand, id: string): Datenbestand {
  existiert(db.projekte, id, "Projekt");
  if (db.beauftragungen.some((b) => b.projektId === id)) {
    throw new Fachfehler("Projekt hat noch Beauftragungen. Bitte zuerst die Beauftragungen löschen.");
  }
  if (db.partnerRegeln.some((r) => r.bezug.typ === "projekt" && r.bezug.id === id)) {
    throw new Fachfehler("Projekt ist Bezug einer Partnerregel.");
  }
  return { ...db, projekte: db.projekte.filter((p) => p.id !== id) };
}

// ── Beauftragung ──────────────────────────────────────

function pruefeBeauftragung(b: Beauftragung) {
  if (b.von > b.bis) throw new Fachfehler("Zeitraum: „von“ liegt nach „bis“.");
  if (b.budgetPt100 <= 0) throw new Fachfehler("PT-Budget muss größer 0 sein.");
  if (b.status === "erwartet" && (b.wahrscheinlichkeitBp === undefined || b.wahrscheinlichkeitBp < 0 || b.wahrscheinlichkeitBp > 10_000)) {
    throw new Fachfehler("Wahrscheinlichkeit muss zwischen 0 und 100 % liegen.");
  }
  if (b.abrechnung.art === "festpreis" && b.abrechnung.festpreisCent <= 0) throw new Fachfehler("Festpreis muss größer 0 sein.");
}

export function speichereBeauftragung(db: Datenbestand, b: Beauftragung): Datenbestand {
  existiert(db.projekte, b.projektId, "Projekt");
  pruefeBeauftragung(b);
  const sauber: Beauftragung = b.status === "erwartet" ? b : { ...b, wahrscheinlichkeitBp: undefined };
  // Monatswerte außerhalb eines verkürzten Zeitraums: offene entfallen, abgeschlossene blockieren
  const zIds = new Set(db.zuordnungen.filter((z) => z.beauftragungId === b.id).map((z) => z.id));
  const ausserhalb = (mw: Monatswert) => zIds.has(mw.zuordnungId) && !liegtIn(mw.monat, b.von, b.bis);
  if (db.monatswerte.some((mw) => ausserhalb(mw) && mw.status === "abgeschlossen")) {
    throw new Fachfehler("Zeitraum schließt abgeschlossene Monate aus.");
  }
  return {
    ...db,
    beauftragungen: upsert(db.beauftragungen, sauber),
    monatswerte: db.monatswerte.filter((mw) => !ausserhalb(mw)),
  };
}

export function loescheBeauftragung(db: Datenbestand, id: string): Datenbestand {
  existiert(db.beauftragungen, id, "Beauftragung");
  const zIds = new Set(db.zuordnungen.filter((z) => z.beauftragungId === id).map((z) => z.id));
  if (istAbgeschlossen(db, zIds)) throw new Fachfehler("Beauftragung hat abgeschlossene Monate und kann nicht gelöscht werden.");
  if (db.partnerRegeln.some((r) => r.bezug.typ === "beauftragung" && r.bezug.id === id)) {
    throw new Fachfehler("Beauftragung ist Bezug einer Partnerregel.");
  }
  return {
    ...db,
    beauftragungen: db.beauftragungen
      .filter((b) => b.id !== id)
      .map((b) => (b.folgeVon === id ? { ...b, folgeVon: undefined } : b)),
    zuordnungen: db.zuordnungen.filter((z) => !zIds.has(z.id)),
    monatswerte: db.monatswerte.filter((mw) => !zIds.has(mw.zuordnungId)),
  };
}

/**
 * Folgebeauftragung: gleicher Zuschnitt direkt im Anschluss, Status „erwartet“.
 * Übernimmt Budget, Abrechnung, Zuordnungen (inkl. Sätze) und die Plan-PT je Monat.
 */
export function erzeugeFolgebeauftragung(
  db: Datenbestand,
  id: string,
  neueId: () => string,
  wahrscheinlichkeitBp: Bp = 5_000,
): { db: Datenbestand; id: string } {
  const quelle = db.beauftragungen.find((b) => b.id === id);
  if (!quelle) throw new Fachfehler("Beauftragung nicht gefunden.");
  const dauer = monateZwischen(quelle.von, quelle.bis).length;
  const von = plusMonate(quelle.bis, 1);
  const folge: Beauftragung = {
    ...quelle,
    id: neueId(),
    name: `${quelle.name} (Folge)`,
    von,
    bis: plusMonate(von, dauer - 1),
    status: "erwartet",
    wahrscheinlichkeitBp,
    folgeVon: quelle.id,
  };
  const zuordnungen: Zuordnung[] = [];
  const monatswerte: Monatswert[] = [];
  for (const z of db.zuordnungen.filter((z) => z.beauftragungId === id)) {
    const neu: Zuordnung = { ...z, id: neueId(), beauftragungId: folge.id };
    zuordnungen.push(neu);
    for (const mw of db.monatswerte.filter((mw) => mw.zuordnungId === z.id)) {
      monatswerte.push({ zuordnungId: neu.id, monat: plusMonate(mw.monat, dauer), planPt100: mw.planPt100, status: "offen" });
    }
  }
  return {
    id: folge.id,
    db: {
      ...db,
      beauftragungen: [...db.beauftragungen, folge],
      zuordnungen: [...db.zuordnungen, ...zuordnungen],
      monatswerte: [...db.monatswerte, ...monatswerte],
    },
  };
}

// ── Mitarbeiter ───────────────────────────────────────

export function speichereMitarbeiter(db: Datenbestand, ma: Mitarbeiter): Datenbestand {
  if (ma.teilzeitBp <= 0 || ma.teilzeitBp > 10_000) throw new Fachfehler("Teilzeitfaktor muss zwischen 1 und 100 % liegen.");
  if (ma.extern && (ma.einkaufssatzCent === undefined || ma.einkaufssatzCent <= 0)) {
    throw new Fachfehler("Externe Mitarbeiter brauchen einen Einkaufstagessatz.");
  }
  if (db.mitarbeiter.some((m) => m.id !== ma.id && m.kuerzel.toLowerCase() === ma.kuerzel.toLowerCase())) {
    throw new Fachfehler(`Kürzel „${ma.kuerzel}“ ist bereits vergeben.`);
  }
  const sauber: Mitarbeiter = ma.extern ? ma : { ...ma, einkaufssatzCent: undefined };
  return { ...db, mitarbeiter: upsert(db.mitarbeiter, sauber) };
}

export function loescheMitarbeiter(db: Datenbestand, id: string): Datenbestand {
  existiert(db.mitarbeiter, id, "Mitarbeiter");
  if (db.zuordnungen.some((z) => z.maId === id)) throw new Fachfehler("Mitarbeiter ist noch Beauftragungen zugeordnet.");
  return {
    ...db,
    mitarbeiter: db.mitarbeiter.filter((m) => m.id !== id),
    abwesenheiten: db.abwesenheiten.filter((a) => a.maId !== id),
  };
}

// ── Zuordnung ─────────────────────────────────────────

/**
 * Ordnet einen MA einer Beauftragung zu und verteilt die Plan-PT gleichmäßig
 * auf die offenen Monate (nach `letzterAbschluss`) des Zeitraums.
 */
export function legeZuordnungAn(
  db: Datenbestand,
  zuordnung: Zuordnung,
  planPt100: Pt100,
  letzterAbschluss: Monat,
): Datenbestand {
  const b = db.beauftragungen.find((x) => x.id === zuordnung.beauftragungId);
  if (!b) throw new Fachfehler("Beauftragung nicht gefunden.");
  existiert(db.mitarbeiter, zuordnung.maId, "Mitarbeiter");
  if (db.zuordnungen.some((z) => z.beauftragungId === b.id && z.maId === zuordnung.maId)) {
    throw new Fachfehler("Mitarbeiter ist dieser Beauftragung bereits zugeordnet.");
  }
  if (zuordnung.vkSatzCent < 0) throw new Fachfehler("Tagessatz darf nicht negativ sein.");
  const offen = monateZwischen(b.von, b.bis).filter((m) => m > letzterAbschluss);
  if (planPt100 > 0 && offen.length === 0) throw new Fachfehler("Die Beauftragung hat keine offenen Monate mehr.");
  const verteilung = verteileGleichmaessig(planPt100, offen);
  return {
    ...db,
    zuordnungen: [...db.zuordnungen, zuordnung],
    monatswerte: [
      ...db.monatswerte,
      ...offen.map((m): Monatswert => ({ zuordnungId: zuordnung.id, monat: m, planPt100: verteilung.get(m) ?? 0, status: "offen" })),
    ],
  };
}

export function aendereZuordnung(db: Datenbestand, zuordnung: Zuordnung): Datenbestand {
  const alt = db.zuordnungen.find((z) => z.id === zuordnung.id);
  if (!alt) throw new Fachfehler("Zuordnung nicht gefunden.");
  if (alt.beauftragungId !== zuordnung.beauftragungId || alt.maId !== zuordnung.maId) {
    throw new Fachfehler("Beauftragung und Mitarbeiter einer Zuordnung sind fest.");
  }
  if (zuordnung.vkSatzCent < 0) throw new Fachfehler("Tagessatz darf nicht negativ sein.");
  return { ...db, zuordnungen: upsert(db.zuordnungen, zuordnung) };
}

export function loescheZuordnung(db: Datenbestand, id: string): Datenbestand {
  existiert(db.zuordnungen, id, "Zuordnung");
  if (istAbgeschlossen(db, new Set([id]))) throw new Fachfehler("Zuordnung hat abgeschlossene Monate und kann nicht gelöscht werden.");
  return {
    ...db,
    zuordnungen: db.zuordnungen.filter((z) => z.id !== id),
    monatswerte: db.monatswerte.filter((mw) => mw.zuordnungId !== id),
  };
}
