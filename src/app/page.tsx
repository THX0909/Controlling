import Link from "next/link";
import { Abschnitt, Karte, Kennzahl, Rang, SeitenKopf } from "@/components/basis";
import { BeauftragungZeile } from "@/components/beauftragung-zeile";
import { Legende, XpLeiste } from "@/components/leisten";
import { MaKarte } from "@/components/ma-karte";
import { auslastung } from "@/domain/auswertung";
import { dbQuote, durchschnittsSatz, summiere } from "@/domain/forecast";
import { monatLang, monateImJahr, monateZwischen, plusMonate } from "@/domain/monat";
import { formatEuro, formatEuroKurz, formatProzent, quoteBp } from "@/domain/zahl";
import { AKTUELLER_MONAT, holeStand, JAHR, LETZTER_ABSCHLUSS } from "@/lib/daten";
import { beauftragungsSicht, kundenSicht } from "@/lib/sichten";

export default function Dashboard() {
  const stand = holeStand();
  const jahr = monateImJahr(JAHR);
  const ist = summiere(stand.zeilen, stand.posten, "sicher", { monate: jahr, abgeschlossen: true });
  const fc = {
    sicher: summiere(stand.zeilen, stand.posten, "sicher", { monate: jahr }),
    gewichtet: summiere(stand.zeilen, stand.posten, "gewichtet", { monate: jahr }),
    best: summiere(stand.zeilen, stand.posten, "best", { monate: jahr }),
  };
  const planAbgeschlossen = stand.zeilenPlan.filter((z) => z.abgeschlossen).reduce((s, z) => s + z.pt100, 0);
  const plantreue = quoteBp(ist.pt100, planAbgeschlossen);
  const satz = durchschnittsSatz(ist);

  const vorschau = monateZwischen(AKTUELLER_MONAT, plusMonate(AKTUELLER_MONAT, 2));
  const kunden = kundenSicht(stand, JAHR, "gewichtet").filter((k) => k.zielCent);
  const aktiv = beauftragungsSicht(stand).filter(
    (z) => z.beauftragung.bis >= AKTUELLER_MONAT && z.beauftragung.von <= AKTUELLER_MONAT && z.beauftragung.status !== "option",
  );

  return (
    <div className="space-y-10">
      <SeitenKopf titel="Übersicht" unter={`${JAHR} · abgeschlossen bis ${monatLang(LETZTER_ABSCHLUSS)}`} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kennzahl label="Umsatz Ist" wert={formatEuroKurz(ist.umsatzCent)} unter={`davon Reise ${formatEuroKurz(ist.reiseCent)}`} />
        <Kennzahl
          label="Forecast Jahr"
          wert={formatEuroKurz(fc.gewichtet.umsatzCent)}
          unter={`${formatEuroKurz(fc.sicher.umsatzCent)} · ${formatEuroKurz(fc.best.umsatzCent)}`}
        />
        <Kennzahl label="DB-Quote" wert={formatProzent(dbQuote(fc.gewichtet), 1)} unter={`DB ${formatEuroKurz(fc.gewichtet.dbCent)}`} />
        <Kennzahl label="Ø Tagessatz Ist" wert={satz === null ? "–" : formatEuro(satz)} unter="ohne Reise" />
        <Kennzahl label="Plantreue" wert={formatProzent(plantreue)} unter="Ist-PT / Plan-PT" />
      </div>
      <p className="-mt-7 text-xs text-faint">Forecast gewichtet; darunter sicher · Best Case.</p>

      <Abschnitt
        titel={`Team · ${monatLang(AKTUELLER_MONAT)}`}
        aktion={<Link href="/auslastung" className="text-xs text-muted hover:text-text">Heatmap →</Link>}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stand.db.mitarbeiter.map((ma) => (
            <MaKarte
              key={ma.id}
              ma={ma}
              monate={vorschau.map((m) => ({
                monat: m,
                auslastung: auslastung(stand, ma.id, m, "beauftragt"),
                inklErwartet: auslastung(stand, ma.id, m, "inkl_erwartet"),
              }))}
            />
          ))}
        </div>
        <p className="text-xs text-faint">Voll = beauftragt, Geisterbalken = inkl. erwartet. Abwesenheit und Teilzeit sind in der Kapazität berücksichtigt.</p>
      </Abschnitt>

      <Abschnitt
        titel="Umsatzziele"
        aktion={<Link href="/kunden" className="text-xs text-muted hover:text-text">Alle Kunden →</Link>}
      >
        <Karte className="divide-y divide-line px-4">
          {kunden.map((k) => (
            <Link
              key={k.kunde.id}
              href={`/kunden/${k.kunde.id}`}
              className="grid grid-cols-[7.5rem_1fr] items-center gap-3 py-3 hover:bg-raised/40 md:grid-cols-[9rem_1fr_9rem]"
            >
              <span className="flex items-center gap-2 text-sm">
                <Rang abc={k.kunde.abc} />
                <span className="truncate">{k.kunde.name}</span>
              </span>
              <XpLeiste istCent={k.istCent} sicherCent={k.sicherCent} gewichtetCent={k.gewichtetCent} zielCent={k.zielCent} />
              <span className="num col-span-2 text-right text-xs text-muted md:col-span-1">
                <span className="text-text">{formatProzent(quoteBp(k.gewichtetCent, k.zielCent!))}</span> von {formatEuroKurz(k.zielCent!)}
              </span>
            </Link>
          ))}
        </Karte>
        <Legende
          eintraege={[
            { art: "voll", text: "Ist" },
            { art: "schraffur", text: "sicherer Forecast" },
            { art: "geist", text: "gewichteter Forecast" },
          ]}
        />
      </Abschnitt>

      <Abschnitt titel={`Laufende Beauftragungen · ${monatLang(AKTUELLER_MONAT)}`}>
        <Karte className="divide-y divide-line px-4">
          {aktiv.map((z) => (
            <BeauftragungZeile key={z.beauftragung.id} zeile={z} mitKunde />
          ))}
        </Karte>
        <Legende
          eintraege={[
            { art: "voll", text: "verbraucht (Ist)" },
            { art: "schraffur", text: "geplant" },
            { art: "crit", text: "über Budget" },
          ]}
        />
      </Abschnitt>
    </div>
  );
}
