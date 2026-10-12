import { monatKurz } from "@/domain/monat";
import { formatPt } from "@/domain/zahl";
import { LETZTER_ABSCHLUSS } from "@/seed/daten";
import type { BeauftragungsZeile } from "@/lib/sichten";
import { StatusChip } from "./basis";
import { Segmentleiste } from "./leisten";

export function BeauftragungZeile({ zeile, mitKunde = false }: { zeile: BeauftragungsZeile; mitKunde?: boolean }) {
  const { beauftragung: b, budget: bu } = zeile;
  const ueber = bu.freiPt100 < 0;
  return (
    <div className="grid grid-cols-1 gap-2 py-3 md:grid-cols-[minmax(0,16rem)_1fr_auto] md:items-center md:gap-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm text-text">{b.name}</span>
          <StatusChip status={b.status} wahrscheinlichkeitBp={b.wahrscheinlichkeitBp} />
          {b.abrechnung.art === "festpreis" && <span className="label">FP</span>}
        </div>
        <div className="num mt-0.5 truncate text-xs text-faint">
          {mitKunde ? `${zeile.kundeName} · ` : ""}
          {zeile.projektName} · {monatKurz(b.von)}–{monatKurz(b.bis)}
        </div>
      </div>
      <Segmentleiste budgetPt100={bu.budgetPt100} verbrauchtPt100={bu.verbrauchtPt100} geplantPt100={bu.geplantPt100} />
      <div className="num flex gap-4 text-xs text-muted md:justify-end">
        <span title="verbraucht / Budget">
          <span className="text-text">{formatPt(bu.verbrauchtPt100)}</span> / {formatPt(bu.budgetPt100)} PT
        </span>
        <span title="frei nach Planung" className={ueber ? "text-crit" : ""}>
          {ueber ? "" : "+"}
          {formatPt(bu.freiPt100)} frei
        </span>
        <span title="Reichweite bei Ø Ist-Verbrauch">
          {b.bis <= LETZTER_ABSCHLUSS ? "beendet" : bu.reichweiteMonate === null ? "–" : `${bu.reichweiteMonate} M`}
        </span>
      </div>
    </div>
  );
}
