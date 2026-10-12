import type { CSSProperties } from "react";
import { Karte, SeitenKopf, Umschalter } from "@/components/basis";
import { auslastung, type AuslastungsFilter } from "@/domain/auswertung";
import { monatKurz, monateImJahr } from "@/domain/monat";
import { formatPt, quoteBp } from "@/domain/zahl";
import { AKTUELLER_MONAT, holeStand, JAHR, LETZTER_ABSCHLUSS } from "@/lib/daten";

function zellenStil(q: number | null): { className: string; style?: CSSProperties } {
  if (q === null) return { className: "text-faint" };
  if (q > 10_000) return { className: "bg-crit/25 text-crit" };
  // Intensität der Akzentfarbe proportional zur Auslastung
  const staerke = Math.round(Math.min(q, 10_000) / 10_000 * 55);
  return {
    className: q >= 5_000 ? "text-text" : "text-muted",
    style: { background: `color-mix(in oklab, var(--accent) ${staerke}%, transparent)` },
  };
}

export default async function AuslastungSeite({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter: f } = await searchParams;
  const filter: AuslastungsFilter = f === "inkl_erwartet" ? "inkl_erwartet" : "beauftragt";
  const stand = holeStand();
  const monate = monateImJahr(JAHR);

  return (
    <div className="space-y-6">
      <SeitenKopf
        titel="Auslastung"
        unter={`Gebuchte PT / Kapazität je Monat · ${JAHR}. Abgeschlossene Monate zeigen Ist.`}
        rechts={
          <Umschalter
            aktiv={filter}
            optionen={[
              { wert: "beauftragt", text: "Nur beauftragt", href: "/auslastung" },
              { wert: "inkl_erwartet", text: "Inkl. erwartet", href: "/auslastung?filter=inkl_erwartet" },
            ]}
          />
        }
      />

      <Karte className="overflow-x-auto">
        <table className="num w-full min-w-[56rem] border-separate border-spacing-1 p-2 text-xs">
          <thead>
            <tr>
              <th className="label w-24 px-2 py-1 text-left font-normal">MA</th>
              {monate.map((m) => (
                <th
                  key={m}
                  className={`px-1 py-1 text-center font-normal ${m === AKTUELLER_MONAT ? "text-accent" : "text-muted"}`}
                >
                  {monatKurz(m)}
                  <div className="text-[0.625rem] text-faint">{m <= LETZTER_ABSCHLUSS ? "Ist" : "Plan"}</div>
                </th>
              ))}
              <th className="label px-2 py-1 text-right font-normal">Ø Jahr</th>
            </tr>
          </thead>
          <tbody>
            {stand.db.mitarbeiter.map((ma) => {
              const werte = monate.map((m) => ({ m, a: auslastung(stand, ma.id, m, filter) }));
              const pt = werte.reduce((s, w) => s + w.a.pt100, 0);
              const kap = werte.reduce((s, w) => s + w.a.kapazitaetPt100, 0);
              const qJahr = quoteBp(pt, kap);
              return (
                <tr key={ma.id}>
                  <th scope="row" className="px-2 text-left font-normal text-text">
                    {ma.kuerzel}
                    {ma.extern && <span className="ml-1.5 text-faint">ext</span>}
                  </th>
                  {werte.map(({ m, a }) => {
                    const stil = zellenStil(a.quoteBp);
                    return (
                      <td
                        key={m}
                        className={`h-10 rounded-[3px] text-center ${stil.className} ${m === AKTUELLER_MONAT ? "ring-1 ring-accent/60" : ""}`}
                        style={stil.style}
                        title={`${ma.kuerzel} · ${monatKurz(m)}: ${formatPt(a.pt100)} / ${formatPt(a.kapazitaetPt100)} PT`}
                      >
                        <span className={a.quoteBp !== null && a.quoteBp > 10_000 ? "ueberbucht" : ""}>
                          {a.quoteBp === null ? "–" : Math.round(a.quoteBp / 100)}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-2 text-right text-muted">{qJahr === null ? "–" : Math.round(qJahr / 100)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Karte>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted">
        <span className="inline-flex items-center gap-2">
          0
          <span className="inline-block h-2 w-24 rounded-sm" style={{ background: "linear-gradient(to right, transparent, color-mix(in oklab, var(--accent) 55%, transparent))", outline: "1px solid var(--line)" }} />
          100 %
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-sm bg-crit/40" /> über Kapazität
        </span>
        <span>Werte in %. Optionen zählen nie. Kein Ranking: Reihenfolge nach Kürzel.</span>
      </div>
    </div>
  );
}
