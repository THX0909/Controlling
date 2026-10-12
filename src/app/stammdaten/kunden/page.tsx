import { Rang, SeitenKopf } from "@/components/basis";
import { ABC_OPTIONEN, Auswahl, Feld, Raster, ReiseFelder } from "@/components/felder";
import { Formular } from "@/components/formular";
import { Formkarte, Liste, ListenZeile } from "@/components/stammdaten-ui";
import { formatEuroKurz } from "@/domain/zahl";
import { holeStand, JAHR } from "@/lib/daten";
import { kundeSpeichern } from "../aktionen";

export default async function KundenStammdaten() {
  const { db } = await holeStand();
  const kunden = [...db.kunden].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-8">
      <SeitenKopf
        titel="Kunden & Projekte"
        unter="Stammdaten pflegen: Kunde → Projekt → Beauftragung → Zuordnung von Mitarbeitern."
      />

      <Liste leer="Noch keine Kunden.">
        {kunden.map((k) => {
          const projekte = db.projekte.filter((p) => p.kundeId === k.id);
          const ziel = k.umsatzziel?.[JAHR];
          return (
            <ListenZeile
              key={k.id}
              href={`/stammdaten/kunden/${k.id}`}
              titel={
                <span className="flex items-center gap-3">
                  <Rang abc={k.abc} />
                  {k.name}
                </span>
              }
              unter={projekte.length === 0 ? "keine Projekte" : projekte.map((p) => p.name).join(" · ")}
              rechts={ziel ? `Ziel ${JAHR}: ${formatEuroKurz(ziel)}` : "kein Ziel"}
            />
          );
        })}
      </Liste>

      <Formkarte titel="Neuer Kunde" id="neu">
        <Formular aktion={kundeSpeichern} knopf="Kunde anlegen" zuruecksetzen>
          <Raster spalten={4}>
            <Feld label="Name" name="name" pflicht platzhalter="Kunde G" />
            <Auswahl label="ABC-Kategorie" name="abc" wert="B" optionen={ABC_OPTIONEN} />
            <Feld label={`Umsatzziel ${JAHR} (€)`} name="ziel" zahl platzhalter="optional" />
            <ReiseFelder />
          </Raster>
        </Formular>
      </Formkarte>
    </div>
  );
}
