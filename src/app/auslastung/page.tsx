import type { CSSProperties } from "react";
import { Karte, SeitenKopf, Umschalter } from "@/components/basis";
import { auslastung, type AuslastungsFilter } from "@/domain/auswertung";
import type { Bp } from "@/domain/typen";
import { monatKurz, monateImJahr } from "@/domain/monat";
import { formatProzent, formatPt, quoteBp } from "@/domain/zahl";
import { AKTUELLER_MONAT, holeStand, JAHR, LETZTER_ABSCHLUSS } from "@/lib/daten";

/** Hintergrund nach Auslastung: Akzent-Intensität bis 100 %, darüber rot. */
function zellenStil(q: Bp | null): { className: string; style?: CSSProperties } {
  if (q === null) return { className: "text-faint" };
  if (q > 10_000) return { className: "bg-crit/25" };
  const staerke = Math.round((Math.min(q, 10_000) / 10_000) * 50);
  return { className: "", style: { background: `color-mix(in oklab, var(--accent) ${staerke}%, transparent)` } };
}

function Zelle({ pt100, kapazitaetPt100, quote, titel, betont }: { pt100: number; kapazitaetPt100: number; quote: Bp | null; titel: string; betont?: boolean }) {
  const stil = zellenStil(quote);
  const ueber = quote !== null && quote > 10_000;
  return (
    <td
      className={`h-12 min-w-[3.5rem] rounded-[3px] px-1 text-center align-middle ${stil.className} ${betont ? "ring-1 ring-accent/60" : ""}`}
      style={stil.style}
      title={titel}
    >
      <div className={`text-sm leading-tight ${pt100 === 0 ? "text-faint" : "text-text"}`}>{formatPt(pt100)}</div>
      <div className={`text-[0.6875rem] leading-tight ${ueber ? "ueberbucht text-crit" : "text-muted"}`}>
        {kapazitaetPt100 === 0 ? "–" : formatProzent(quote)}
      </div>
    </td>
  );
}

export default async function AuslastungSeite({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter: f } = await searchParams;
  const filter: AuslastungsFilter = f === "inkl_erwartet" ? "inkl_erwartet" : "beauftragt";
  const stand = await holeStand();
  const monate = monateImJahr(JAHR);

  return (
    <div className="space-y-6">
      <SeitenKopf
        titel="Auslastung"
        unter={`Gebuchte PT je Mitarbeiter und Monat ${JAHR}, darunter die Auslastung (PT ÷ Kapazität).`}
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
        <table className="num w-full min-w-[54rem] border-separate border-spacing-1 p-2">
          <thead>
            <tr className="text-xs">
              <th className="label sticky left-0 z-10 w-16 bg-surface px-2 py-1 text-left font-normal">MA</th>
              {monate.map((m) => (
                <th key={m} className={`px-1 py-1 text-center font-normal ${m === AKTUELLER_MONAT ? "text-accent" : "text-muted"}`}>
                  {monatKurz(m)}
                  <div className="text-[0.625rem] text-faint">{m <= LETZTER_ABSCHLUSS ? "Ist" : "Plan"}</div>
                </th>
              ))}
              <th className="label px-2 py-1 text-center font-normal">Jahr</th>
            </tr>
          </thead>
          <tbody>
            {stand.db.mitarbeiter.map((ma) => {
              const werte = monate.map((m) => ({ m, a: auslastung(stand, ma.id, m, filter) }));
              const pt = werte.reduce((s, w) => s + w.a.pt100, 0);
              const kap = werte.reduce((s, w) => s + w.a.kapazitaetPt100, 0);
              return (
                <tr key={ma.id}>
                  <th scope="row" className="sticky left-0 z-10 bg-surface px-2 text-left text-sm font-normal text-text">
                    {ma.kuerzel}
                    {ma.extern && <div className="text-[0.625rem] text-faint">extern</div>}
                  </th>
                  {werte.map(({ m, a }) => (
                    <Zelle
                      key={m}
                      pt100={a.pt100}
                      kapazitaetPt100={a.kapazitaetPt100}
                      quote={a.quoteBp}
                      betont={m === AKTUELLER_MONAT}
                      titel={`${ma.kuerzel} · ${monatKurz(m)}: ${formatPt(a.pt100)} PT von ${formatPt(a.kapazitaetPt100)} PT Kapazität`}
                    />
                  ))}
                  <td className="border-l border-line px-2 text-center">
                    <div className="text-sm text-text">{formatPt(pt)}</div>
                    <div className="text-[0.6875rem] text-muted">{formatProzent(quoteBp(pt, kap))}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Karte>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="num rounded-[3px] bg-raised px-1.5 py-0.5 text-center leading-tight">
            <span className="text-text">17</span>
            <br />
            <span className="text-[0.625rem]">77 %</span>
          </span>
          = 17 PT gebucht, 77 % der Kapazität
        </span>
        <span className="inline-flex items-center gap-2">
          0 %
          <span
            className="inline-block h-2 w-20 rounded-sm"
            style={{ background: "linear-gradient(to right, transparent, color-mix(in oklab, var(--accent) 50%, transparent))", outline: "1px solid var(--line)" }}
          />
          100 %
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-sm bg-crit/40" /> über Kapazität
        </span>
      </div>
      <p className="text-xs text-faint">
        Kapazität = Arbeitstage (ohne Feiertage BW) × Teilzeitfaktor − Urlaub/interne Zeit. Optionen zählen nie. Reihenfolge nach Kürzel, kein Ranking.
        Details per Tooltip.
      </p>
    </div>
  );
}
