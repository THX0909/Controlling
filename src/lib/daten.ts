import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { connection } from "next/server";
import { erzeugeStand, type Stand } from "@/domain/auswertung";
import { pruefeDatenbestand } from "@/domain/schema";
import type { Datenbestand } from "@/domain/typen";
import { seed } from "@/seed/daten";

export { AKTUELLER_MONAT, JAHR, LETZTER_ABSCHLUSS } from "@/seed/daten";

/**
 * Datenzugriff, Übergangslösung bis zur Datenbank (Phase 2):
 * JSON-Datei auf dem Server, beim ersten Start aus den Seed-Daten befüllt.
 * Die Schnittstelle (holeStand / aendereDaten) bleibt beim Wechsel auf Postgres gleich.
 */
const DATEI = process.env.DATEN_DATEI ?? path.join(/* turbopackIgnore: true */ process.cwd(), ".daten", "bestand.json");

async function lade(): Promise<Datenbestand> {
  try {
    return pruefeDatenbestand(JSON.parse(await readFile(DATEI, "utf8")));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return structuredClone(seed);
    throw new Error(`Datenbestand ${DATEI} ist ungültig: ${(e as Error).message}`);
  }
}

async function schreibe(db: Datenbestand) {
  await mkdir(path.dirname(DATEI), { recursive: true });
  const tmp = `${DATEI}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await rename(tmp, DATEI); // atomar ersetzen
}

export async function holeStand(): Promise<Stand> {
  await connection(); // immer zur Anfragezeit lesen, nie beim Build vorrendern
  return erzeugeStand(await lade());
}

let warteschlange: Promise<unknown> = Promise.resolve();

/** Serialisierte Änderung: lesen → ändern → prüfen → schreiben. */
export function aendereDaten(aenderung: (db: Datenbestand) => Datenbestand): Promise<void> {
  const lauf = warteschlange.then(async () => {
    const geprueft = pruefeDatenbestand(aenderung(await lade()));
    erzeugeStand(geprueft); // referenzielle Konsistenz: wirft bei fehlenden Bezügen
    await schreibe(geprueft);
  });
  warteschlange = lauf.catch(() => undefined);
  return lauf;
}

export const neueId = () => randomUUID();
