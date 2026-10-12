import { kapazitaet } from "./kalender";
import { berechnePartnerkosten, type PartnerPosten } from "./partner";
import type { Beauftragung, Bp, Datenbestand, Monat, Pt100 } from "./typen";
import { baueIndex, berechneZeilen, type Index, type Zeile } from "./umsatz";
import { quoteBp } from "./zahl";

/** Vorberechneter Stand für alle Auswertungen. */
export interface Stand {
  db: Datenbestand;
  index: Index;
  /** gültige Werte: Ist in abgeschlossenen Monaten, sonst Plan */
  zeilen: Zeile[];
  posten: PartnerPosten[];
  /** reine Planwerte (für Plan/Ist-Vergleich) */
  zeilenPlan: Zeile[];
  postenPlan: PartnerPosten[];
}

export function erzeugeStand(db: Datenbestand): Stand {
  const index = baueIndex(db);
  const zeilen = berechneZeilen(db, "gueltig", index);
  const zeilenPlan = berechneZeilen(db, "plan", index);
  return {
    db,
    index,
    zeilen,
    posten: berechnePartnerkosten(zeilen, db.partnerRegeln, index),
    zeilenPlan,
    postenPlan: berechnePartnerkosten(zeilenPlan, db.partnerRegeln, index),
  };
}

export type AuslastungsFilter = "beauftragt" | "inkl_erwartet";

export interface Auslastung {
  pt100: Pt100;
  kapazitaetPt100: Pt100;
  /** null bei Kapazität 0 */
  quoteBp: Bp | null;
}

/** Auslastung = gebuchte PT (ungewichtet) / Kapazität. Optionen zählen nie. */
export function auslastung(stand: Stand, maId: string, mon: Monat, filter: AuslastungsFilter): Auslastung {
  const ma = stand.index.ma.get(maId);
  if (!ma) throw new Error(`Mitarbeiter ${maId} nicht gefunden`);
  const pt100 = stand.zeilen
    .filter(
      (z) =>
        z.maId === maId &&
        z.monat === mon &&
        (z.abgeschlossen || z.status === "beauftragt" || (filter === "inkl_erwartet" && z.status === "erwartet")),
    )
    .reduce((s, z) => s + z.pt100, 0);
  const kapazitaetPt100 = kapazitaet(ma, mon, stand.db.abwesenheiten);
  return { pt100, kapazitaetPt100, quoteBp: quoteBp(pt100, kapazitaetPt100) };
}

export interface Budget {
  budgetPt100: Pt100;
  /** Ist abgeschlossener Monate */
  verbrauchtPt100: Pt100;
  /** Plan offener Monate */
  geplantPt100: Pt100;
  /** Budget − verbraucht − geplant (negativ = überplant) */
  freiPt100: Pt100;
  verbrauchBp: Bp | null;
  /** Monate bis Budget aufgebraucht bei Ø Ist-Verbrauch; null ohne Ist */
  reichweiteMonate: number | null;
}

export function budget(stand: Stand, b: Beauftragung): Budget {
  const zeilen = stand.zeilen.filter((z) => z.beauftragungId === b.id);
  const verbraucht = zeilen.filter((z) => z.abgeschlossen).reduce((s, z) => s + z.pt100, 0);
  const geplant = zeilen.filter((z) => !z.abgeschlossen).reduce((s, z) => s + z.pt100, 0);
  const istMonate = new Set(zeilen.filter((z) => z.abgeschlossen).map((z) => z.monat)).size;
  const rest = b.budgetPt100 - verbraucht;
  return {
    budgetPt100: b.budgetPt100,
    verbrauchtPt100: verbraucht,
    geplantPt100: geplant,
    freiPt100: rest - geplant,
    verbrauchBp: quoteBp(verbraucht, b.budgetPt100),
    reichweiteMonate:
      istMonate === 0 || verbraucht === 0 ? null : Math.max(0, Math.floor((rest * istMonate) / verbraucht)),
  };
}

export function beauftragungenVonKunde(stand: Stand, kundeId: string): Beauftragung[] {
  const projekte = new Set(stand.db.projekte.filter((p) => p.kundeId === kundeId).map((p) => p.id));
  return stand.db.beauftragungen.filter((b) => projekte.has(b.projektId));
}
