import { SeitenKopf } from "@/components/basis";
import { ART_OPTIONEN, Auswahl, Feld, Raster } from "@/components/felder";
import { Formular } from "@/components/formular";
import { Formkarte, Liste, ListenZeile } from "@/components/stammdaten-ui";
import { formatEuro, formatProzent } from "@/domain/zahl";
import { holeStand } from "@/lib/daten";
import { mitarbeiterSpeichern } from "../aktionen";

export default async function MitarbeiterStammdaten() {
  const { db } = await holeStand();
  const liste = [...db.mitarbeiter].sort((a, b) => a.kuerzel.localeCompare(b.kuerzel));

  return (
    <div className="space-y-8">
      <SeitenKopf titel="Mitarbeiter" unter="Intern oder extern (mit Einkaufstagessatz), Teilzeitfaktor für die Kapazität." />

      <Liste leer="Noch keine Mitarbeiter.">
        {liste.map((m) => {
          const anzahl = db.zuordnungen.filter((z) => z.maId === m.id).length;
          return (
            <ListenZeile
              key={m.id}
              href={`/stammdaten/mitarbeiter/${m.id}`}
              titel={
                <span>
                  <span className="num">{m.kuerzel}</span> <span className="text-muted">{m.name}</span>
                </span>
              }
              unter={`${m.extern ? `extern · Einkauf ${formatEuro(m.einkaufssatzCent ?? 0)} / PT` : "intern"} · ${formatProzent(m.teilzeitBp)}`}
              rechts={`${anzahl} Zuordnung${anzahl === 1 ? "" : "en"}`}
            />
          );
        })}
      </Liste>

      <Formkarte titel="Neuer Mitarbeiter" id="neu">
        <Formular aktion={mitarbeiterSpeichern} knopf="Mitarbeiter anlegen" zuruecksetzen>
          <Raster spalten={4}>
            <Feld label="Kürzel" name="kuerzel" pflicht platzhalter="MA7" />
            <Feld label="Bezeichnung" name="name" pflicht platzhalter="MA 7" hinweis="Im Prototyp nur Platzhalter, keine echten Namen." />
            <Feld label="Teilzeitfaktor (%)" name="teilzeit" zahl wert="100" pflicht />
            <Auswahl label="Art" name="art" wert="intern" optionen={ART_OPTIONEN} />
            <Feld label="Einkaufstagessatz (€)" name="einkaufssatz" zahl wenn="extern" platzhalter="850" />
          </Raster>
        </Formular>
      </Formkarte>
    </div>
  );
}
