"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  aendereZuordnung,
  erzeugeFolgebeauftragung,
  Fachfehler,
  legeZuordnungAn,
  loescheBeauftragung,
  loescheKunde,
  loescheMitarbeiter,
  loescheProjekt,
  loescheZuordnung,
  speichereBeauftragung,
  speichereKunde,
  speichereMitarbeiter,
  speichereProjekt,
} from "@/domain/stammdaten";
import type { Beauftragung } from "@/domain/typen";
import { aendereDaten, JAHR, LETZTER_ABSCHLUSS, neueId } from "@/lib/daten";
import {
  baueReiseregel,
  lies,
  reiseFelder,
  zEuro,
  zEuroOptional,
  zId,
  zMonat,
  zProzent,
  zProzentOptional,
  zPt,
  zText,
} from "@/lib/formular";

export type Ergebnis = { fehler?: string; ok?: string } | undefined;

/**
 * Gemeinsamer Ablauf: Eingabe prüfen und ändern; Fachfehler als Meldung zurück,
 * sonst Seiten neu laden und ggf. weiterleiten. (Zugriffsprüfung folgt mit Auth in Phase 2.)
 */
async function ausfuehren(schritt: () => Promise<string | void>, meldung = "Gespeichert."): Promise<Ergebnis> {
  let ziel: string | void;
  try {
    ziel = await schritt();
  } catch (e) {
    if (e instanceof Fachfehler) return { fehler: e.message };
    console.error(e);
    return { fehler: "Speichern fehlgeschlagen. Bitte erneut versuchen." };
  }
  revalidatePath("/", "layout");
  if (ziel) redirect(ziel);
  return { ok: meldung };
}

// ── Kunde ─────────────────────────────────────────────

const kundeSchema = z.object({
  id: z.string().optional(),
  name: zText("Name"),
  abc: z.enum(["A", "B", "C"], { message: "ABC-Kategorie wählen." }),
  ziel: zEuroOptional("Umsatzziel"),
  ...reiseFelder,
});

export async function kundeSpeichern(_: Ergebnis, fd: FormData): Promise<Ergebnis> {
  return ausfuehren(async () => {
    const e = lies(kundeSchema, fd);
    const id = e.id || neueId();
    await aendereDaten((db) => {
      const alt = db.kunden.find((k) => k.id === id);
      const umsatzziel = { ...alt?.umsatzziel };
      if (e.ziel === undefined) delete umsatzziel[JAHR];
      else umsatzziel[JAHR] = e.ziel;
      return speichereKunde(db, {
        id,
        name: e.name,
        abc: e.abc,
        umsatzziel,
        reiseregel: baueReiseregel(e.reiseart === "kunde" ? "keine" : e.reiseart, e.reisebetrag) ?? { art: "keine" },
      });
    });
    if (!e.id) return `/stammdaten/kunden/${id}`;
  });
}

export async function kundeLoeschen(_: Ergebnis, fd: FormData): Promise<Ergebnis> {
  return ausfuehren(async () => {
    const { id } = lies(z.object({ id: zId }), fd);
    await aendereDaten((db) => loescheKunde(db, id));
    return "/stammdaten/kunden";
  });
}

// ── Projekt ───────────────────────────────────────────

export async function projektSpeichern(_: Ergebnis, fd: FormData): Promise<Ergebnis> {
  return ausfuehren(async () => {
    const e = lies(z.object({ id: z.string().optional(), kundeId: zId, name: zText("Projektname") }), fd);
    const id = e.id || neueId();
    await aendereDaten((db) => speichereProjekt(db, { id, kundeId: e.kundeId, name: e.name }));
    if (!e.id) return `/stammdaten/projekte/${id}`;
  });
}

export async function projektLoeschen(_: Ergebnis, fd: FormData): Promise<Ergebnis> {
  return ausfuehren(async () => {
    const { id, kundeId } = lies(z.object({ id: zId, kundeId: zId }), fd);
    await aendereDaten((db) => loescheProjekt(db, id));
    return `/stammdaten/kunden/${kundeId}`;
  });
}

// ── Beauftragung ──────────────────────────────────────

const beauftragungSchema = z.object({
  id: z.string().optional(),
  projektId: zId,
  name: zText("Bezeichnung"),
  von: zMonat("Von"),
  bis: zMonat("Bis"),
  budget: zPt("PT-Budget"),
  status: z.enum(["beauftragt", "erwartet", "option"], { message: "Status wählen." }),
  wahrscheinlichkeit: zProzentOptional("Wahrscheinlichkeit"),
  abrechnung: z.enum(["tm", "festpreis"], { message: "Abrechnungsart wählen." }),
  festpreis: zEuroOptional("Festpreis"),
});

export async function beauftragungSpeichern(_: Ergebnis, fd: FormData): Promise<Ergebnis> {
  return ausfuehren(async () => {
    const e = lies(beauftragungSchema, fd);
    if (e.abrechnung === "festpreis" && e.festpreis === undefined) throw new Fachfehler("Festpreis fehlt.");
    if (e.status === "erwartet" && e.wahrscheinlichkeit === undefined) throw new Fachfehler("Wahrscheinlichkeit fehlt.");
    const id = e.id || neueId();
    await aendereDaten((db) => {
      const alt = db.beauftragungen.find((b) => b.id === id);
      const b: Beauftragung = {
        id,
        projektId: e.projektId,
        name: e.name,
        von: e.von,
        bis: e.bis,
        budgetPt100: e.budget,
        status: e.status,
        wahrscheinlichkeitBp: e.wahrscheinlichkeit,
        abrechnung: e.abrechnung === "festpreis" ? { art: "festpreis", festpreisCent: e.festpreis! } : { art: "tm" },
        folgeVon: alt?.folgeVon,
      };
      return speichereBeauftragung(db, b);
    });
    if (!e.id) return `/stammdaten/beauftragungen/${id}`;
  });
}

export async function beauftragungLoeschen(_: Ergebnis, fd: FormData): Promise<Ergebnis> {
  return ausfuehren(async () => {
    const { id, projektId } = lies(z.object({ id: zId, projektId: zId }), fd);
    await aendereDaten((db) => loescheBeauftragung(db, id));
    return `/stammdaten/projekte/${projektId}`;
  });
}

export async function folgebeauftragungErzeugen(_: Ergebnis, fd: FormData): Promise<Ergebnis> {
  return ausfuehren(async () => {
    const { id, wahrscheinlichkeit } = lies(z.object({ id: zId, wahrscheinlichkeit: zProzent("Wahrscheinlichkeit") }), fd);
    if (wahrscheinlichkeit > 10_000) throw new Fachfehler("Wahrscheinlichkeit maximal 100 %.");
    let neu = "";
    await aendereDaten((db) => {
      const r = erzeugeFolgebeauftragung(db, id, neueId, wahrscheinlichkeit);
      neu = r.id;
      return r.db;
    });
    return `/stammdaten/beauftragungen/${neu}`;
  });
}

// ── Mitarbeiter ───────────────────────────────────────

const maSchema = z.object({
  id: z.string().optional(),
  kuerzel: zText("Kürzel", 12),
  name: zText("Bezeichnung"),
  art: z.enum(["intern", "extern"]),
  einkaufssatz: zEuroOptional("Einkaufstagessatz"),
  teilzeit: zProzent("Teilzeitfaktor"),
});

export async function mitarbeiterSpeichern(_: Ergebnis, fd: FormData): Promise<Ergebnis> {
  return ausfuehren(async () => {
    const e = lies(maSchema, fd);
    const id = e.id || neueId();
    await aendereDaten((db) =>
      speichereMitarbeiter(db, {
        id,
        kuerzel: e.kuerzel,
        name: e.name,
        extern: e.art === "extern",
        einkaufssatzCent: e.einkaufssatz,
        teilzeitBp: e.teilzeit,
      }),
    );
    if (!e.id) return `/stammdaten/mitarbeiter/${id}`;
  });
}

export async function mitarbeiterLoeschen(_: Ergebnis, fd: FormData): Promise<Ergebnis> {
  return ausfuehren(async () => {
    const { id } = lies(z.object({ id: zId }), fd);
    await aendereDaten((db) => loescheMitarbeiter(db, id));
    return "/stammdaten/mitarbeiter";
  });
}

// ── Zuordnung ─────────────────────────────────────────

export async function zuordnungAnlegen(_: Ergebnis, fd: FormData): Promise<Ergebnis> {
  return ausfuehren(async () => {
    const e = lies(
      z.object({ beauftragungId: zId, maId: zId, satz: zEuro("Verkaufstagessatz"), pt: zPt("Plan-PT"), ...reiseFelder }),
      fd,
    );
    await aendereDaten((db) =>
      legeZuordnungAn(
        db,
        { id: neueId(), beauftragungId: e.beauftragungId, maId: e.maId, vkSatzCent: e.satz, reiseOverride: baueReiseregel(e.reiseart, e.reisebetrag) },
        e.pt,
        LETZTER_ABSCHLUSS,
      ),
    );
  }, "Zuordnung angelegt.");
}

export async function zuordnungAendern(_: Ergebnis, fd: FormData): Promise<Ergebnis> {
  return ausfuehren(async () => {
    const e = lies(z.object({ id: zId, satz: zEuro("Verkaufstagessatz"), ...reiseFelder }), fd);
    await aendereDaten((db) => {
      const alt = db.zuordnungen.find((z) => z.id === e.id);
      if (!alt) throw new Fachfehler("Zuordnung nicht gefunden.");
      return aendereZuordnung(db, { ...alt, vkSatzCent: e.satz, reiseOverride: baueReiseregel(e.reiseart, e.reisebetrag) });
    });
  });
}

export async function zuordnungLoeschen(_: Ergebnis, fd: FormData): Promise<Ergebnis> {
  return ausfuehren(async () => {
    const { id } = lies(z.object({ id: zId }), fd);
    await aendereDaten((db) => loescheZuordnung(db, id));
  }, "Zuordnung gelöscht.");
}
