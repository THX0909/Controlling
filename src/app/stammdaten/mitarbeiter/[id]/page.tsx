import { notFound } from "next/navigation";
import { SeitenKopf } from "@/components/basis";
import { ART_OPTIONEN, Auswahl, Feld, Raster, Versteckt } from "@/components/felder";
import { Formular } from "@/components/formular";
import { Formkarte, Liste, ListenZeile, Pfad } from "@/components/stammdaten-ui";
import { euroFeld, prozentFeld } from "@/domain/eingabe";
import { monatKurz } from "@/domain/monat";
import { formatEuro } from "@/domain/zahl";
import { holeStand } from "@/lib/daten";
import { mitarbeiterLoeschen, mitarbeiterSpeichern } from "../../aktionen";

export default async function MitarbeiterBearbeiten({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = await holeStand();
  const ma = db.mitarbeiter.find((m) => m.id === id);
  if (!ma) notFound();
  const zuordnungen = db.zuordnungen
    .filter((z) => z.maId === id)
    .map((z) => {
      const b = db.beauftragungen.find((x) => x.id === z.beauftragungId)!;
      const p = db.projekte.find((x) => x.id === b.projektId)!;
      return { z, b, kunde: db.kunden.find((k) => k.id === p.kundeId)!.name };
    })
    .sort((a, b) => a.b.von.localeCompare(b.b.von));

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Pfad teile={[{ text: "Mitarbeiter", href: "/stammdaten/mitarbeiter" }, { text: ma.kuerzel }]} />
        <SeitenKopf titel={`${ma.kuerzel} · ${ma.name}`} />
      </div>

      <Formkarte titel="Stammdaten">
        <Formular aktion={mitarbeiterSpeichern} knopf="Speichern">
          <Versteckt name="id" wert={ma.id} />
          <Raster spalten={4}>
            <Feld label="Kürzel" name="kuerzel" wert={ma.kuerzel} pflicht />
            <Feld label="Bezeichnung" name="name" wert={ma.name} pflicht />
            <Feld label="Teilzeitfaktor (%)" name="teilzeit" zahl wert={prozentFeld(ma.teilzeitBp)} pflicht />
            <Auswahl label="Art" name="art" wert={ma.extern ? "extern" : "intern"} optionen={ART_OPTIONEN} />
            <Feld label="Einkaufstagessatz (€)" name="einkaufssatz" zahl wert={euroFeld(ma.einkaufssatzCent)} wenn="extern" />
          </Raster>
        </Formular>
      </Formkarte>

      <section className="space-y-3">
        <h2 className="label">Zuordnungen</h2>
        <Liste leer="Keine Zuordnungen.">
          {zuordnungen.map(({ z, b, kunde }) => (
            <ListenZeile
              key={z.id}
              href={`/stammdaten/beauftragungen/${b.id}`}
              titel={b.name}
              unter={`${kunde} · ${monatKurz(b.von)}–${monatKurz(b.bis)}`}
              rechts={`${formatEuro(z.vkSatzCent)} / PT`}
            />
          ))}
        </Liste>
      </section>

      <Formkarte titel="Mitarbeiter löschen">
        <p className="text-sm text-muted">Nur möglich ohne Zuordnungen.</p>
        <Formular aktion={mitarbeiterLoeschen} knopf="Mitarbeiter löschen" gefahr bestaetigen={`${ma.kuerzel} wirklich löschen?`}>
          <Versteckt name="id" wert={ma.id} />
        </Formular>
      </Formkarte>
    </div>
  );
}
