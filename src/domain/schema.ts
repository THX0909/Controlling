import { z } from "zod";
import type { Datenbestand } from "./typen";

/** Laufzeitprüfung des gespeicherten Datenbestands (Struktur und Ganzzahligkeit). */
const ganz = z.number().int();
const nichtNeg = ganz.nonnegative();
const monat = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const id = z.string().min(1);

const reiseregel = z.discriminatedUnion("art", [
  z.object({ art: z.literal("keine") }),
  z.object({ art: z.literal("pro_tag"), cent: nichtNeg }),
  z.object({ art: z.literal("pro_monat"), cent: nichtNeg }),
]);

export const datenbestandSchema = z.object({
  kunden: z.array(
    z.object({
      id,
      name: z.string().min(1),
      abc: z.enum(["A", "B", "C"]),
      umsatzziel: z.record(z.string().regex(/^\d{4}$/), nichtNeg).optional(),
      reiseregel,
    }),
  ),
  projekte: z.array(z.object({ id, kundeId: id, name: z.string().min(1) })),
  beauftragungen: z.array(
    z.object({
      id,
      projektId: id,
      name: z.string().min(1),
      von: monat,
      bis: monat,
      budgetPt100: nichtNeg,
      status: z.enum(["beauftragt", "erwartet", "option"]),
      wahrscheinlichkeitBp: nichtNeg.max(10_000).optional(),
      abrechnung: z.discriminatedUnion("art", [
        z.object({ art: z.literal("tm") }),
        z.object({ art: z.literal("festpreis"), festpreisCent: nichtNeg }),
      ]),
      folgeVon: id.optional(),
    }),
  ),
  mitarbeiter: z.array(
    z.object({
      id,
      kuerzel: z.string().min(1),
      name: z.string().min(1),
      extern: z.boolean(),
      einkaufssatzCent: nichtNeg.optional(),
      teilzeitBp: nichtNeg.max(10_000),
    }),
  ),
  zuordnungen: z.array(z.object({ id, beauftragungId: id, maId: id, vkSatzCent: nichtNeg, reiseOverride: reiseregel.optional() })),
  monatswerte: z.array(
    z.object({
      zuordnungId: id,
      monat,
      planPt100: nichtNeg,
      istPt100: nichtNeg.optional(),
      reisetagePt100: nichtNeg.optional(),
      status: z.enum(["offen", "abgeschlossen"]),
    }),
  ),
  abwesenheiten: z.array(z.object({ maId: id, monat, pt100: nichtNeg })),
  partner: z.array(z.object({ id, name: z.string().min(1) })),
  partnerRegeln: z.array(
    z.object({
      id,
      partnerId: id,
      bezug: z.object({ typ: z.enum(["kunde", "projekt", "beauftragung"]), id }),
      art: z.discriminatedUnion("typ", [
        z.object({ typ: z.literal("prozent"), bp: nichtNeg }),
        z.object({ typ: z.literal("fix_pro_pt"), cent: nichtNeg }),
        z.object({ typ: z.literal("pauschale_monat"), cent: nichtNeg }),
        z.object({ typ: z.literal("pauschale_beauftragung"), cent: nichtNeg }),
      ]),
      basis: z.enum(["mit_reise", "ohne_reise"]),
      gueltigVon: monat,
      gueltigBis: monat.optional(),
    }),
  ),
});

export function pruefeDatenbestand(roh: unknown): Datenbestand {
  return datenbestandSchema.parse(roh) as Datenbestand;
}
