import "server-only";
import { erzeugeStand, type Stand } from "@/domain/auswertung";
import { seed } from "@/seed/daten";

export { AKTUELLER_MONAT, JAHR, LETZTER_ABSCHLUSS } from "@/seed/daten";

let cache: Stand | undefined;

/**
 * Datenzugriff. Phase 1: Seed-Daten im Speicher.
 * Ab Phase 2 lädt diese Funktion aus Supabase mit dem JWT des Nutzers (RLS).
 */
export function holeStand(): Stand {
  cache ??= erzeugeStand(seed);
  return cache;
}
