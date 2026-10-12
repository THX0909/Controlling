import type { Auslastung } from "@/domain/auswertung";
import { monatKurz } from "@/domain/monat";
import type { Mitarbeiter, Monat } from "@/domain/typen";
import { formatProzent, formatPt } from "@/domain/zahl";
import { Karte } from "./basis";
import { Energieleiste } from "./leisten";

/** Mitarbeiter als Karte mit Energieleiste (aktueller Monat) und Vorschau der Folgemonate. */
export function MaKarte({
  ma,
  monate,
}: {
  ma: Mitarbeiter;
  monate: { monat: Monat; auslastung: Auslastung; inklErwartet: Auslastung }[];
}) {
  const [aktuell, ...folgende] = monate;
  if (!aktuell) return null;
  const ueber = (aktuell.auslastung.quoteBp ?? 0) > 10_000;
  return (
    <Karte className="space-y-3 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="num text-sm text-text">{ma.kuerzel}</span>
          {ma.extern && <span className="label">extern</span>}
          {ma.teilzeitBp < 10_000 && <span className="num text-xs text-faint">{formatProzent(ma.teilzeitBp)}</span>}
        </div>
        <span className={`num text-sm ${ueber ? "text-crit" : "text-text"}`}>{formatProzent(aktuell.auslastung.quoteBp)}</span>
      </div>
      <Energieleiste quoteBp={aktuell.auslastung.quoteBp} erwartetBp={aktuell.inklErwartet.quoteBp} hoehe="h-2" />
      <div className="num flex justify-between text-xs text-muted">
        <span>
          {formatPt(aktuell.auslastung.pt100)} / {formatPt(aktuell.auslastung.kapazitaetPt100)} PT
          {aktuell.inklErwartet.pt100 > aktuell.auslastung.pt100 && (
            <span className="text-faint"> · +{formatPt(aktuell.inklErwartet.pt100 - aktuell.auslastung.pt100)} erw.</span>
          )}
        </span>
        <span>{monatKurz(aktuell.monat)}</span>
      </div>
      {folgende.length > 0 && (
        <div className="grid grid-cols-2 gap-3 border-t border-line pt-3">
          {folgende.map((f) => (
            <div key={f.monat} className="space-y-1">
              <div className="num flex justify-between text-[0.6875rem] text-faint">
                <span>{monatKurz(f.monat)}</span>
                <span>{formatProzent(f.auslastung.quoteBp)}</span>
              </div>
              <Energieleiste quoteBp={f.auslastung.quoteBp} erwartetBp={f.inklErwartet.quoteBp} hoehe="h-1" />
            </div>
          ))}
        </div>
      )}
    </Karte>
  );
}
