import { notFound } from "next/navigation";
import { SeitenKopf, StatusChip } from "@/components/basis";
import { ABRECHNUNG_OPTIONEN, Auswahl, Feld, Raster, STATUS_OPTIONEN, Versteckt } from "@/components/felder";
import { Formular } from "@/components/formular";
import { Formkarte, Liste, ListenZeile, Pfad } from "@/components/stammdaten-ui";
import { monatLang } from "@/domain/monat";
import { formatPt } from "@/domain/zahl";
import { AKTUELLER_MONAT, holeStand, JAHR } from "@/lib/daten";
import { beauftragungSpeichern, projektLoeschen, projektSpeichern } from "../../aktionen";

export default async function ProjektBearbeiten({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = await holeStand();
  const projekt = db.projekte.find((p) => p.id === id);
  if (!projekt) notFound();
  const kunde = db.kunden.find((k) => k.id === projekt.kundeId)!;
  const beauftragungen = db.beauftragungen.filter((b) => b.projektId === id).sort((a, b) => a.von.localeCompare(b.von));

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Pfad
          teile={[
            { text: "Kunden & Projekte", href: "/stammdaten/kunden" },
            { text: kunde.name, href: `/stammdaten/kunden/${kunde.id}` },
            { text: projekt.name },
          ]}
        />
        <SeitenKopf titel={projekt.name} unter={kunde.name} />
      </div>

      <Formkarte titel="Projekt">
        <Formular aktion={projektSpeichern} knopf="Speichern">
          <Versteckt name="id" wert={projekt.id} />
          <Versteckt name="kundeId" wert={kunde.id} />
          <Raster spalten={2}>
            <Feld label="Projektname" name="name" wert={projekt.name} pflicht />
          </Raster>
        </Formular>
      </Formkarte>

      <section className="space-y-3">
        <h2 className="label">Beauftragungen</h2>
        <Liste leer="Noch keine Beauftragungen.">
          {beauftragungen.map((b) => (
            <ListenZeile
              key={b.id}
              href={`/stammdaten/beauftragungen/${b.id}`}
              titel={
                <span className="flex items-center gap-2">
                  {b.name}
                  <StatusChip status={b.status} wahrscheinlichkeitBp={b.wahrscheinlichkeitBp} />
                </span>
              }
              unter={`${monatLang(b.von)} – ${monatLang(b.bis)}${b.abrechnung.art === "festpreis" ? " · Festpreis" : ""}`}
              rechts={`${formatPt(b.budgetPt100)} PT Budget`}
            />
          ))}
        </Liste>
      </section>

      <Formkarte titel="Neue Beauftragung">
        <Formular aktion={beauftragungSpeichern} knopf="Beauftragung anlegen" zuruecksetzen>
          <Versteckt name="projektId" wert={projekt.id} />
          <Raster spalten={4}>
            <Feld label="Bezeichnung" name="name" pflicht platzhalter="z. B. Q1 2027" />
            <Feld label="Von" name="von" typ="month" wert={AKTUELLER_MONAT} pflicht />
            <Feld label="Bis" name="bis" typ="month" wert={`${JAHR}-12`} pflicht />
            <Feld label="PT-Budget" name="budget" zahl pflicht platzhalter="60" />
            <Auswahl label="Status" name="status" wert="beauftragt" optionen={STATUS_OPTIONEN} />
            <Feld label="Wahrscheinlichkeit (%)" name="wahrscheinlichkeit" zahl wert="50" wenn="erwartet" />
            <Auswahl label="Abrechnung" name="abrechnung" wert="tm" optionen={ABRECHNUNG_OPTIONEN} />
            <Feld label="Festpreis (€)" name="festpreis" zahl wenn="festpreis" />
          </Raster>
        </Formular>
      </Formkarte>

      <Formkarte titel="Projekt löschen">
        <p className="text-sm text-muted">Nur möglich, wenn das Projekt keine Beauftragungen und keine Partnerregeln hat.</p>
        <Formular aktion={projektLoeschen} knopf="Projekt löschen" gefahr bestaetigen={`${projekt.name} wirklich löschen?`}>
          <Versteckt name="id" wert={projekt.id} />
          <Versteckt name="kundeId" wert={kunde.id} />
        </Formular>
      </Formkarte>
    </div>
  );
}
