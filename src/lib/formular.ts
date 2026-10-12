import { z } from "zod";
import { parseEuro, parseProzent, parsePt } from "@/domain/eingabe";
import { Fachfehler } from "@/domain/stammdaten";
import type { Reiseregel } from "@/domain/typen";

/** Zod-Bausteine für Formularfelder (FormData liefert immer Strings). */

export const zText = (label: string, max = 120) =>
  z.string().trim().min(1, `${label} fehlt.`).max(max, `${label} ist zu lang (max. ${max} Zeichen).`);

function zahl(label: string, parse: (s: string) => number | null, optional: boolean) {
  return z.string().transform((s, ctx) => {
    if (s.trim() === "") {
      if (optional) return undefined;
      ctx.addIssue({ code: "custom", message: `${label} fehlt.` });
      return z.NEVER;
    }
    const wert = parse(s);
    if (wert === null || wert < 0) {
      ctx.addIssue({ code: "custom", message: `${label}: „${s}“ ist keine gültige Zahl.` });
      return z.NEVER;
    }
    return wert;
  });
}

export const zEuro = (label: string) => zahl(label, parseEuro, false) as z.ZodType<number, string>;
export const zEuroOptional = (label: string) => zahl(label, parseEuro, true) as z.ZodType<number | undefined, string>;
export const zPt = (label: string) => zahl(label, parsePt, false) as z.ZodType<number, string>;
export const zProzentOptional = (label: string) => zahl(label, parseProzent, true) as z.ZodType<number | undefined, string>;
export const zProzent = (label: string) => zahl(label, parseProzent, false) as z.ZodType<number, string>;
export const zMonat = (label: string) => z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, `${label}: Monat im Format JJJJ-MM angeben.`);
export const zId = z.string().min(1, "Bezug fehlt.");

/** FormData gegen Schema prüfen; Fehler gesammelt als Fachfehler. */
export function lies<S extends z.ZodType>(schema: S, fd: FormData): z.output<S> {
  const roh = Object.fromEntries([...fd.entries()].filter(([k]) => !k.startsWith("$")).map(([k, v]) => [k, String(v)]));
  const r = schema.safeParse(roh);
  if (!r.success) throw new Fachfehler(r.error.issues.map((i) => i.message).join(" "));
  return r.data;
}

/** Reiseregel aus Feldern `reiseart` + `reisebetrag`; "kunde" = keine Übersteuerung. */
export const reiseFelder = {
  reiseart: z.enum(["keine", "pro_tag", "pro_monat", "kunde"], { message: "Reisekostenregel ungültig." }),
  reisebetrag: zEuroOptional("Reisepauschale"),
};

export function baueReiseregel(art: "keine" | "pro_tag" | "pro_monat" | "kunde", betrag: number | undefined): Reiseregel | undefined {
  if (art === "kunde") return undefined;
  if (art === "keine") return { art: "keine" };
  if (betrag === undefined) throw new Fachfehler("Reisepauschale fehlt.");
  return { art, cent: betrag };
}
