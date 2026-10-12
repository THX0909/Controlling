import type { ReactNode } from "react";
import { euroFeld } from "@/domain/eingabe";
import type { Reiseregel } from "@/domain/typen";

const eingabeStil =
  "w-full rounded-md border border-line bg-bg px-2.5 py-1.5 text-sm text-text outline-none placeholder:text-faint focus:border-accent";

/** Bedingte Sichtbarkeit per CSS (:has), siehe globals.css: erwartet | festpreis | extern | reise */
type Wenn = "erwartet" | "festpreis" | "extern" | "reise";

export function Feld({
  label,
  name,
  wert,
  typ = "text",
  hinweis,
  platzhalter,
  wenn,
  zahl = false,
  pflicht = false,
}: {
  label: string;
  name: string;
  wert?: string;
  typ?: "text" | "month";
  hinweis?: string;
  platzhalter?: string;
  wenn?: Wenn;
  zahl?: boolean;
  pflicht?: boolean;
}) {
  return (
    <label className="block space-y-1" data-wenn={wenn}>
      <span className="text-xs text-muted">
        {label}
        {pflicht && <span className="text-faint"> *</span>}
      </span>
      <input
        name={name}
        type={typ}
        defaultValue={wert}
        placeholder={platzhalter}
        required={pflicht}
        inputMode={zahl ? "decimal" : undefined}
        autoComplete="off"
        className={`${eingabeStil} ${zahl ? "num" : ""}`}
      />
      {hinweis && <span className="block text-[0.6875rem] text-faint">{hinweis}</span>}
    </label>
  );
}

export function Auswahl({
  label,
  name,
  optionen,
  wert,
  wenn,
}: {
  label: string;
  name: string;
  optionen: { wert: string; text: string }[];
  wert?: string;
  wenn?: Wenn;
}) {
  return (
    <label className="block space-y-1" data-wenn={wenn}>
      <span className="text-xs text-muted">{label}</span>
      <select name={name} defaultValue={wert} className={eingabeStil}>
        {optionen.map((o) => (
          <option key={o.wert} value={o.wert}>
            {o.text}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Raster({ children, spalten = 3 }: { children: ReactNode; spalten?: 2 | 3 | 4 }) {
  const klasse = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[spalten];
  return <div className={`grid grid-cols-1 gap-3 ${klasse}`}>{children}</div>;
}

export function Versteckt({ name, wert }: { name: string; wert: string }) {
  return <input type="hidden" name={name} value={wert} />;
}

/** Reisekostenregel: Art + Betrag. `mitKunde` = Option "wie Kunde" (keine Übersteuerung). */
export function ReiseFelder({ regel, mitKunde = false }: { regel?: Reiseregel; mitKunde?: boolean }) {
  const art = regel?.art ?? (mitKunde ? "kunde" : "keine");
  return (
    <>
      <Auswahl
        label="Reisekosten"
        name="reiseart"
        wert={art}
        optionen={[
          ...(mitKunde ? [{ wert: "kunde", text: "wie Kunde" }] : []),
          { wert: "keine", text: "keine" },
          { wert: "pro_tag", text: "Pauschale pro Reisetag" },
          { wert: "pro_monat", text: "Pauschale pro Monat" },
        ]}
      />
      <Feld
        label="Pauschale (€)"
        name="reisebetrag"
        zahl
        wert={regel && regel.art !== "keine" ? euroFeld(regel.cent) : ""}
        platzhalter="200"
        wenn="reise"
      />
    </>
  );
}

export const ABC_OPTIONEN = [
  { wert: "A", text: "A" },
  { wert: "B", text: "B" },
  { wert: "C", text: "C" },
];

export const STATUS_OPTIONEN = [
  { wert: "beauftragt", text: "beauftragt" },
  { wert: "erwartet", text: "erwartet" },
  { wert: "option", text: "Option" },
];

export const ABRECHNUNG_OPTIONEN = [
  { wert: "tm", text: "nach Aufwand (T&M)" },
  { wert: "festpreis", text: "Festpreis" },
];

export const ART_OPTIONEN = [
  { wert: "intern", text: "intern" },
  { wert: "extern", text: "extern" },
];
