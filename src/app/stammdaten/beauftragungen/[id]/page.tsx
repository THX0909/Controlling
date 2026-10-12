import Link from "next/link";
import { notFound } from "next/navigation";
import { Karte, SeitenKopf, StatusChip } from "@/components/basis";
import { ABRECHNUNG_OPTIONEN, Auswahl, Feld, Raster, ReiseFelder, STATUS_OPTIONEN, Versteckt } from "@/components/felder";
import { Formular } from "@/components/formular";
import { Segmentleiste } from "@/components/leisten";
import { Formkarte, Pfad } from "@/components/stammdaten-ui";
import { budget } from "@/domain/auswertung";
import { euroFeld, prozentFeld, ptFeld } from "@/domain/eingabe";
import { monatKurz, monatLang, plusMonate } from "@/domain/monat";
import type { Reiseregel } from "@/domain/typen";
import { formatEuro, formatPt } from "@/domain/zahl";
import { holeStand, LETZTER_ABSCHLUSS } from "@/lib/daten";
import {
  beauftragungLoeschen,
  beauftragungSpeichern,
  folgebeauftragungErzeugen,
  zuordnungAendern,
  zuordnungAnlegen,
  zuordnungLoeschen,
} from "../../aktionen";

function reiseKurz(r: Reiseregel | undefined): string {
  if (!r) return "wie Kunde";
  if (r.art === "keine") return "keine";
  return `${formatEuro(r.cent)} ${r.art === "pro_tag" ? "/ Tag" : "/ Monat"}`;
}

export default async function BeauftragungBearbeiten({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stand = await holeStand();
  const { db } = stand;
  const b = db.beauftragungen.find((x) => x.id === id);
  if (!b) notFound();
  const projekt = db.projekte.find((p) => p.id === b.projektId)!;
  const kunde = db.kunden.find((k) => k.id === projekt.kundeId)!;
  const bu = budget(stand, b);
  const folge = db.beauftragungen.filter((x) => x.folgeVon === b.id);
  const vorgaenger = b.folgeVon ? db.beauftragungen.find((x) => x.id === b.folgeVon) : undefined;
  const zuordnungen = db.zuordnungen
    .filter((z) => z.beauftragungId === id)
    .map((z) => {
      const werte = db.monatswerte.filter((mw) => mw.zuordnungId === z.id);
      return {
        z,
        ma: db.mitarbeiter.find((m) => m.id === z.maId)!,
        istPt: werte.filter((w) => w.status === "abgeschlossen").reduce((s, w) => s + (w.istPt100 ?? 0), 0),
        planPt: werte.filter((w) => w.status === "offen").reduce((s, w) => s + w.planPt100, 0),
        hatAbschluss: werte.some((w) => w.status === "abgeschlossen"),
      };
    });
  const ersterOffener = [plusMonate(LETZTER_ABSCHLUSS, 1), b.von].sort()[1]!;
  const freieMa = db.mitarbeiter.filter((m) => !zuordnungen.some((x) => x.ma.id === m.id));

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Pfad
          teile={[
            { text: "Kunden & Projekte", href: "/stammdaten/kunden" },
            { text: kunde.name, href: `/stammdaten/kunden/${kunde.id}` },
            { text: projekt.name, href: `/stammdaten/projekte/${projekt.id}` },
            { text: b.name },
          ]}
        />
        <SeitenKopf
          titel={b.name}
          unter={
            <span className="inline-flex flex-wrap items-center gap-2">
              <StatusChip status={b.status} wahrscheinlichkeitBp={b.wahrscheinlichkeitBp} />
              {monatLang(b.von)} – {monatLang(b.bis)}
              {vorgaenger && (
                <Link href={`/stammdaten/beauftragungen/${vorgaenger.id}`} className="text-xs hover:text-text">
                  · Folge von {vorgaenger.name}
                </Link>
              )}
            </span>
          }
        />
      </div>

      <Karte className="space-y-2 p-5">
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <span className="label">PT-Budget</span>
          <span className="num text-xs text-muted">
            <span className="text-text">{formatPt(bu.verbrauchtPt100)}</span> Ist + {formatPt(bu.geplantPt100)} Plan von {formatPt(bu.budgetPt100)} PT ·{" "}
            <span className={bu.freiPt100 < 0 ? "text-crit" : ""}>{formatPt(bu.freiPt100)} frei</span>
          </span>
        </div>
        <Segmentleiste budgetPt100={bu.budgetPt100} verbrauchtPt100={bu.verbrauchtPt100} geplantPt100={bu.geplantPt100} />
      </Karte>

      <Formkarte titel="Beauftragung">
        <Formular aktion={beauftragungSpeichern} knopf="Speichern">
          <Versteckt name="id" wert={b.id} />
          <Versteckt name="projektId" wert={projekt.id} />
          <Raster spalten={4}>
            <Feld label="Bezeichnung" name="name" wert={b.name} pflicht />
            <Feld label="Von" name="von" typ="month" wert={b.von} pflicht />
            <Feld label="Bis" name="bis" typ="month" wert={b.bis} pflicht />
            <Feld label="PT-Budget" name="budget" zahl wert={ptFeld(b.budgetPt100)} pflicht />
            <Auswahl label="Status" name="status" wert={b.status} optionen={STATUS_OPTIONEN} />
            <Feld label="Wahrscheinlichkeit (%)" name="wahrscheinlichkeit" zahl wert={prozentFeld(b.wahrscheinlichkeitBp) || "50"} wenn="erwartet" />
            <Auswahl label="Abrechnung" name="abrechnung" wert={b.abrechnung.art} optionen={ABRECHNUNG_OPTIONEN} />
            <Feld
              label="Festpreis (€)"
              name="festpreis"
              zahl
              wert={b.abrechnung.art === "festpreis" ? euroFeld(b.abrechnung.festpreisCent) : ""}
              wenn="festpreis"
            />
          </Raster>
          <p className="text-[0.6875rem] text-faint">
            Verkürzt man den Zeitraum, entfallen offene Planwerte außerhalb. Abgeschlossene Monate bleiben geschützt.
          </p>
        </Formular>
      </Formkarte>

      <section className="space-y-3">
        <h2 className="label">Zugeordnete Mitarbeiter</h2>
        {zuordnungen.length === 0 ? (
          <p className="text-sm text-faint">Noch niemand zugeordnet.</p>
        ) : (
          <Karte className="divide-y divide-line">
            {zuordnungen.map(({ z, ma, istPt, planPt, hatAbschluss }) => (
              <details key={z.id} className="group">
                <summary className="num flex cursor-pointer list-none flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-3 text-sm hover:bg-raised/40">
                  <span className="font-sans text-text">
                    {ma.kuerzel} <span className="text-xs text-faint">{ma.name}</span>
                  </span>
                  <span className="flex flex-wrap gap-x-5 text-xs text-muted">
                    <span>{formatEuro(z.vkSatzCent)} / PT</span>
                    <span>Reise {reiseKurz(z.reiseOverride)}</span>
                    <span>
                      <span className="text-text">{formatPt(istPt)}</span> Ist · {formatPt(planPt)} Plan
                    </span>
                    <span className="text-faint group-open:hidden">bearbeiten ▾</span>
                  </span>
                </summary>
                <div className="space-y-4 border-t border-line bg-bg/40 px-4 py-4">
                  <Formular aktion={zuordnungAendern} knopf="Speichern">
                    <Versteckt name="id" wert={z.id} />
                    <Raster spalten={3}>
                      <Feld label="Verkaufstagessatz (€)" name="satz" zahl wert={euroFeld(z.vkSatzCent)} pflicht />
                      <ReiseFelder regel={z.reiseOverride} mitKunde />
                    </Raster>
                  </Formular>
                  {!hatAbschluss && (
                    <Formular aktion={zuordnungLoeschen} knopf="Zuordnung löschen" gefahr bestaetigen={`${ma.kuerzel} aus ${b.name} entfernen?`}>
                      <Versteckt name="id" wert={z.id} />
                    </Formular>
                  )}
                </div>
              </details>
            ))}
          </Karte>
        )}
        <p className="text-xs text-faint">Plan-PT je Monat werden später per Drag & Drop in der Planung angepasst (Phase 2/3).</p>
      </section>

      <Formkarte titel="Mitarbeiter zuordnen">
        {freieMa.length === 0 ? (
          <p className="text-sm text-faint">Alle Mitarbeiter sind bereits zugeordnet.</p>
        ) : (
          <Formular aktion={zuordnungAnlegen} knopf="Zuordnen" zuruecksetzen>
            <Versteckt name="beauftragungId" wert={b.id} />
            <Raster spalten={4}>
              <Auswahl
                label="Mitarbeiter"
                name="maId"
                optionen={freieMa.map((m) => ({ wert: m.id, text: `${m.kuerzel} – ${m.name}${m.extern ? " (extern)" : ""}` }))}
              />
              <Feld label="Verkaufstagessatz (€)" name="satz" zahl pflicht platzhalter="1200" />
              <Feld
                label="Plan-PT gesamt"
                name="pt"
                zahl
                pflicht
                platzhalter="30"
                hinweis={`gleichmäßig auf die offenen Monate ab ${monatKurz(ersterOffener)} verteilt`}
              />
              <ReiseFelder mitKunde />
            </Raster>
          </Formular>
        )}
      </Formkarte>

      <Formkarte titel="Folgebeauftragung erzeugen">
        <p className="text-sm text-muted">
          Legt eine Beauftragung direkt im Anschluss an (gleiche Dauer, gleiches Budget, gleiche Zuordnungen und Planwerte) mit Status „erwartet“.
          {folge.length > 0 && ` Bereits vorhanden: ${folge.map((f) => f.name).join(", ")}.`}
        </p>
        <Formular aktion={folgebeauftragungErzeugen} knopf="Folgebeauftragung erzeugen">
          <Versteckt name="id" wert={b.id} />
          <Raster spalten={4}>
            <Feld label="Wahrscheinlichkeit (%)" name="wahrscheinlichkeit" zahl wert="50" pflicht />
          </Raster>
        </Formular>
      </Formkarte>

      <Formkarte titel="Beauftragung löschen">
        <p className="text-sm text-muted">Nur möglich ohne abgeschlossene Monate. Zuordnungen und Planwerte werden mit gelöscht.</p>
        <Formular aktion={beauftragungLoeschen} knopf="Beauftragung löschen" gefahr bestaetigen={`${b.name} mit allen Zuordnungen löschen?`}>
          <Versteckt name="id" wert={b.id} />
          <Versteckt name="projektId" wert={projekt.id} />
        </Formular>
      </Formkarte>
    </div>
  );
}
