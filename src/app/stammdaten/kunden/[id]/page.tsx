import Link from "next/link";
import { notFound } from "next/navigation";
import { SeitenKopf } from "@/components/basis";
import { ABC_OPTIONEN, Auswahl, Feld, Raster, ReiseFelder, Versteckt } from "@/components/felder";
import { Formular } from "@/components/formular";
import { Formkarte, Liste, ListenZeile, Pfad } from "@/components/stammdaten-ui";
import { euroFeld } from "@/domain/eingabe";
import { monatKurz } from "@/domain/monat";
import { holeStand, JAHR } from "@/lib/daten";
import { kundeLoeschen, kundeSpeichern, projektSpeichern } from "../../aktionen";

export default async function KundeBearbeiten({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = await holeStand();
  const kunde = db.kunden.find((k) => k.id === id);
  if (!kunde) notFound();
  const projekte = db.projekte.filter((p) => p.kundeId === id);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Pfad teile={[{ text: "Kunden & Projekte", href: "/stammdaten/kunden" }, { text: kunde.name }]} />
        <SeitenKopf
          titel={kunde.name}
          rechts={
            <Link href={`/kunden/${id}`} className="text-xs text-muted hover:text-text">
              Kundensicht →
            </Link>
          }
        />
      </div>

      <Formkarte titel="Stammdaten">
        <Formular aktion={kundeSpeichern} knopf="Speichern">
          <Versteckt name="id" wert={kunde.id} />
          <Raster spalten={4}>
            <Feld label="Name" name="name" wert={kunde.name} pflicht />
            <Auswahl label="ABC-Kategorie" name="abc" wert={kunde.abc} optionen={ABC_OPTIONEN} />
            <Feld label={`Umsatzziel ${JAHR} (€)`} name="ziel" zahl wert={euroFeld(kunde.umsatzziel?.[JAHR])} platzhalter="optional" />
            <ReiseFelder regel={kunde.reiseregel} />
          </Raster>
        </Formular>
      </Formkarte>

      <section className="space-y-3">
        <h2 className="label">Projekte</h2>
        <Liste leer="Noch keine Projekte.">
          {projekte.map((p) => {
            const bs = db.beauftragungen.filter((b) => b.projektId === p.id);
            return (
              <ListenZeile
                key={p.id}
                href={`/stammdaten/projekte/${p.id}`}
                titel={p.name}
                unter={bs.length === 0 ? "keine Beauftragungen" : bs.map((b) => `${b.name} (${monatKurz(b.von)}–${monatKurz(b.bis)})`).join(" · ")}
                rechts={`${bs.length} Beauftragung${bs.length === 1 ? "" : "en"}`}
              />
            );
          })}
        </Liste>
      </section>

      <Formkarte titel="Neues Projekt">
        <Formular aktion={projektSpeichern} knopf="Projekt anlegen" zuruecksetzen>
          <Versteckt name="kundeId" wert={kunde.id} />
          <Raster spalten={2}>
            <Feld label="Projektname" name="name" pflicht />
          </Raster>
        </Formular>
      </Formkarte>

      <Formkarte titel="Kunde löschen">
        <p className="text-sm text-muted">Nur möglich, wenn der Kunde keine Projekte und keine Partnerregeln hat.</p>
        <Formular aktion={kundeLoeschen} knopf="Kunde löschen" gefahr bestaetigen={`${kunde.name} wirklich löschen?`}>
          <Versteckt name="id" wert={kunde.id} />
        </Formular>
      </Formkarte>
    </div>
  );
}
