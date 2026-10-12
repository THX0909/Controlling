import Link from "next/link";
import type { ReactNode } from "react";
import type { Abc, BeauftragungStatus, Bp } from "@/domain/typen";
import { formatProzent } from "@/domain/zahl";

export function Karte({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-line bg-surface ${className}`}>{children}</div>;
}

export function Abschnitt({ titel, aktion, children }: { titel: string; aktion?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="label">{titel}</h2>
        {aktion}
      </div>
      {children}
    </section>
  );
}

export function Kennzahl({ label, wert, unter }: { label: string; wert: ReactNode; unter?: ReactNode }) {
  return (
    <Karte className="px-4 py-3">
      <div className="label">{label}</div>
      <div className="num mt-1.5 text-xl text-text">{wert}</div>
      {unter && <div className="num mt-1 text-xs text-muted">{unter}</div>}
    </Karte>
  );
}

/** ABC-Kategorie als Rang-Symbol (Winkel wie Dienstgrade): A = 3, B = 2, C = 1 */
export function Rang({ abc }: { abc: Abc }) {
  const anzahl = { A: 3, B: 2, C: 1 }[abc];
  return (
    <span className="inline-flex items-center gap-1.5" title={`Kategorie ${abc}`}>
      <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden className="text-accent">
        {Array.from({ length: 3 }, (_, i) => (
          <path
            key={i}
            d={`M1 ${3 + i * 4.5} L7 ${0.5 + i * 4.5} L13 ${3 + i * 4.5}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={i < anzahl ? 1 : 0.18}
          />
        ))}
      </svg>
      <span className="num text-xs text-muted">{abc}</span>
    </span>
  );
}

const STATUS_STIL: Record<BeauftragungStatus, string> = {
  beauftragt: "text-ok border-ok/40",
  erwartet: "text-warn border-warn/40",
  option: "text-muted border-line",
};

export function StatusChip({ status, wahrscheinlichkeitBp }: { status: BeauftragungStatus; wahrscheinlichkeitBp?: Bp }) {
  return (
    <span className={`num inline-flex items-center gap-1 rounded border px-1.5 py-px text-[0.6875rem] ${STATUS_STIL[status]}`}>
      {status}
      {status === "erwartet" && wahrscheinlichkeitBp !== undefined && <span>{formatProzent(wahrscheinlichkeitBp)}</span>}
    </span>
  );
}

export function SeitenKopf({ titel, unter, rechts }: { titel: string; unter?: ReactNode; rechts?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-lg font-medium tracking-tight text-text">{titel}</h1>
        {unter && <p className="mt-1 text-sm text-muted">{unter}</p>}
      </div>
      {rechts}
    </header>
  );
}

/** Umschalter als Links (Zustand in Search-Params, serverseitig gerendert) */
export function Umschalter({ optionen, aktiv }: { optionen: { wert: string; text: string; href: string }[]; aktiv: string }) {
  return (
    <div className="inline-flex rounded-md border border-line bg-surface p-0.5 text-xs" role="tablist">
      {optionen.map((o) => (
        <Link
          key={o.wert}
          href={o.href}
          role="tab"
          aria-selected={o.wert === aktiv}
          className={`rounded px-2.5 py-1 ${o.wert === aktiv ? "bg-raised text-text" : "text-muted hover:text-text"}`}
        >
          {o.text}
        </Link>
      ))}
    </div>
  );
}
