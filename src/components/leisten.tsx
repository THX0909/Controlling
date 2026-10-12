import type { Bp, Cent, Pt100 } from "@/domain/typen";

const prozent = (bp: number) => `${Math.max(0, Math.min(bp, 10_000)) / 100}%`;

/** Auslastung als Energieleiste. > 100 % pulsiert dezent rot. */
export function Energieleiste({
  quoteBp,
  erwartetBp,
  hoehe = "h-1.5",
}: {
  quoteBp: Bp | null;
  /** Auslastung inkl. erwarteter PT, als Geisterbalken */
  erwartetBp?: Bp | null;
  hoehe?: string;
}) {
  const q = quoteBp ?? 0;
  const ueber = q > 10_000;
  return (
    <div
      className={`relative w-full overflow-hidden rounded-sm bg-line ${hoehe}`}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(q / 100)}
      aria-label="Auslastung"
    >
      {erwartetBp != null && erwartetBp > q && (
        <div
          className={`absolute inset-y-0 left-0 rounded-sm ${erwartetBp > 10_000 ? "bg-crit/30" : "geist"}`}
          style={{ width: prozent(erwartetBp) }}
        />
      )}
      <div
        className={`relative h-full rounded-sm transition-[width] duration-500 ${ueber ? "bg-crit ueberbucht" : "bg-accent"}`}
        style={{ width: prozent(q) }}
      />
      {/* 25-%-Raster wie Energiezellen */}
      <div className="pointer-events-none absolute inset-0 flex">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-full w-1/4 border-r border-bg" />
        ))}
      </div>
    </div>
  );
}

/**
 * Umsatzziel als XP-Leiste:
 * Ist voll · sicherer Forecast schraffiert · gewichteter Forecast als Geisterbalken.
 * Werte kumuliert (sicher ≥ ist, gewichtet ≥ sicher).
 */
export function XpLeiste({
  istCent,
  sicherCent,
  gewichtetCent,
  zielCent,
  hoehe = "h-2.5",
}: {
  istCent: Cent;
  sicherCent: Cent;
  gewichtetCent: Cent;
  zielCent?: Cent;
  hoehe?: string;
}) {
  const skala = zielCent && zielCent > 0 ? zielCent : Math.max(gewichtetCent, 1);
  const bp = (c: Cent) => Math.round((c / skala) * 10_000);
  const ueberZiel = zielCent !== undefined && gewichtetCent > zielCent;
  return (
    <div className={`relative w-full rounded-sm bg-line ${hoehe}`} aria-label="Umsatz gegen Ziel">
      <div className="geist absolute inset-y-0 left-0 rounded-sm" style={{ width: prozent(bp(gewichtetCent)) }} />
      <div className="schraffur absolute inset-y-0 left-0 rounded-sm" style={{ width: prozent(bp(sicherCent)) }} />
      <div className="absolute inset-y-0 left-0 rounded-sm bg-accent" style={{ width: prozent(bp(istCent)) }} />
      {ueberZiel && <div className="absolute -right-1 inset-y-[-3px] w-0.5 rounded bg-ok" title="Ziel übertroffen" />}
    </div>
  );
}

/**
 * PT-Budget als Segmentleiste (1 Segment = 1 PT):
 * verbraucht voll · geplant schraffiert · frei leer · überplant rot.
 */
export function Segmentleiste({
  budgetPt100,
  verbrauchtPt100,
  geplantPt100,
}: {
  budgetPt100: Pt100;
  verbrauchtPt100: Pt100;
  geplantPt100: Pt100;
}) {
  const gesamt = verbrauchtPt100 + geplantPt100;
  const skala = Math.max(budgetPt100, gesamt, 1);
  const pct = (pt: number) => `${(pt / skala) * 100}%`;
  const segmente = Math.max(1, Math.round(skala / 100));
  // 1 Fuge = 1 PT; bei großen Budgets je 5 bzw. 10 PT, damit die Fugen nicht wie Schraffur wirken
  const ptJeFuge = segmente <= 60 ? 1 : segmente <= 300 ? 5 : 10;
  const ueber = gesamt - budgetPt100;
  return (
    <div className="space-y-1">
      <div className="relative h-3 w-full overflow-hidden rounded-[2px] bg-line">
        <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: pct(Math.min(verbrauchtPt100, skala)) }} />
        <div
          className="schraffur absolute inset-y-0"
          style={{ left: pct(verbrauchtPt100), width: pct(Math.max(0, Math.min(geplantPt100, budgetPt100 - verbrauchtPt100))) }}
        />
        {ueber > 0 && (
          <div className="absolute inset-y-0 bg-crit" style={{ left: pct(budgetPt100), width: pct(ueber) }} />
        )}
        {/* Segmentfugen */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(to right, transparent calc(100% - 1px), var(--surface) 0)",
            backgroundSize: `${(100 * ptJeFuge) / segmente}% 100%`,
          }}
        />
      </div>
      {ptJeFuge > 1 && <div className="num text-[0.625rem] text-faint">1 Segment = {ptJeFuge} PT</div>}
    </div>
  );
}

export function Legende({ eintraege }: { eintraege: { art: "voll" | "schraffur" | "geist" | "crit"; text: string }[] }) {
  const klasse = { voll: "bg-accent", schraffur: "schraffur", geist: "geist", crit: "bg-crit" };
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      {eintraege.map((e) => (
        <span key={e.text} className="inline-flex items-center gap-1.5">
          <span className={`inline-block h-2 w-3 rounded-[2px] ${klasse[e.art]}`} />
          {e.text}
        </span>
      ))}
    </div>
  );
}
