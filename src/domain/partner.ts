import { liegtIn } from "./monat";
import type { BeauftragungStatus, Bp, Cent, Monat, PartnerRegel } from "./typen";
import type { Index, Zeile } from "./umsatz";
import { anteil, ptMalSatz } from "./zahl";

/**
 * Ein Partnerkosten-Posten. Er hängt an genau einer Beauftragung, damit
 * Forecast-Gewichte (Status, Wahrscheinlichkeit) darauf anwendbar sind.
 */
export interface PartnerPosten {
  regelId: string;
  partnerId: string;
  monat: Monat;
  kundeId: string;
  beauftragungId: string;
  status: BeauftragungStatus;
  wahrscheinlichkeitBp: Bp;
  abgeschlossen: boolean;
  cent: Cent;
}

function passtZuBezug(regel: PartnerRegel, zeile: Zeile): boolean {
  switch (regel.bezug.typ) {
    case "kunde":
      return zeile.kundeId === regel.bezug.id;
    case "projekt":
      return zeile.projektId === regel.bezug.id;
    case "beauftragung":
      return zeile.beauftragungId === regel.bezug.id;
  }
}

const STATUS_RANG: Record<BeauftragungStatus, number> = { beauftragt: 0, erwartet: 1, option: 2 };

/** Für Pauschalen: die "sicherste" aktive Beauftragung trägt den Posten. */
function staerksteZeile(zeilen: readonly Zeile[]): Zeile | undefined {
  return [...zeilen].sort(
    (a, b) => STATUS_RANG[a.status] - STATUS_RANG[b.status] || b.wahrscheinlichkeitBp - a.wahrscheinlichkeitBp,
  )[0];
}

function posten(regel: PartnerRegel, zeile: Zeile, cent: Cent): PartnerPosten {
  return {
    regelId: regel.id,
    partnerId: regel.partnerId,
    monat: zeile.monat,
    kundeId: zeile.kundeId,
    beauftragungId: zeile.beauftragungId,
    status: zeile.status,
    wahrscheinlichkeitBp: zeile.wahrscheinlichkeitBp,
    abgeschlossen: zeile.abgeschlossen,
    cent,
  };
}

/**
 * Partnerkosten aus Umsatzzeilen.
 * - prozent / fix_pro_pt: je Zeile (linear)
 * - pauschale_monat: einmal je Monat, in dem der Bezug PT > 0 hat
 * - pauschale_beauftragung: einmal im Startmonat der Beauftragung (Bezug muss Beauftragung sein),
 *   sofern dieser in der Gültigkeit liegt
 * Mehrere gültige Regeln (auch verschiedener Ebenen) wirken additiv.
 */
export function berechnePartnerkosten(
  zeilen: readonly Zeile[],
  regeln: readonly PartnerRegel[],
  index: Index,
): PartnerPosten[] {
  const ergebnis: PartnerPosten[] = [];
  for (const regel of regeln) {
    const betroffen = zeilen.filter(
      (z) => passtZuBezug(regel, z) && liegtIn(z.monat, regel.gueltigVon, regel.gueltigBis),
    );
    const art = regel.art;
    switch (art.typ) {
      case "prozent":
        for (const z of betroffen) {
          const basis = z.ptUmsatzCent + (regel.basis === "mit_reise" ? z.reiseCent : 0);
          ergebnis.push(posten(regel, z, anteil(basis, art.bp)));
        }
        break;
      case "fix_pro_pt":
        for (const z of betroffen) ergebnis.push(posten(regel, z, ptMalSatz(z.pt100, art.cent)));
        break;
      case "pauschale_monat": {
        const jeMonat = new Map<Monat, Zeile[]>();
        for (const z of betroffen.filter((z) => z.pt100 > 0)) {
          jeMonat.set(z.monat, [...(jeMonat.get(z.monat) ?? []), z]);
        }
        for (const gruppe of jeMonat.values()) {
          const z = staerksteZeile(gruppe);
          if (z) ergebnis.push(posten(regel, z, art.cent));
        }
        break;
      }
      case "pauschale_beauftragung": {
        if (regel.bezug.typ !== "beauftragung") {
          throw new Error(`Regel ${regel.id}: Pauschale je Beauftragung braucht Bezug Beauftragung`);
        }
        const b = index.beauftragung.get(regel.bezug.id);
        if (!b || betroffen.length === 0) break;
        // Startmonat; fehlt dort eine Zeile, der früheste Monat mit Zeile
        const zielMonat = betroffen.some((z) => z.monat === b.von)
          ? b.von
          : betroffen.map((z) => z.monat).sort()[0];
        const z = staerksteZeile(betroffen.filter((z) => z.monat === zielMonat));
        if (z) ergebnis.push(posten(regel, z, art.cent));
        break;
      }
    }
  }
  return ergebnis;
}
