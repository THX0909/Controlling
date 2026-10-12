import Link from "next/link";
import type { ReactNode } from "react";
import { Karte } from "./basis";

/** Brotkrumen für Stammdaten-Seiten */
export function Pfad({ teile }: { teile: { text: string; href?: string }[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted" aria-label="Pfad">
      {teile.map((t, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          {i > 0 && <span className="text-faint">/</span>}
          {t.href ? (
            <Link href={t.href} className="hover:text-text">
              {t.text}
            </Link>
          ) : (
            <span className="text-text">{t.text}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function Formkarte({ titel, id, children }: { titel: string; id?: string; children: ReactNode }) {
  return (
    <Karte className="space-y-4 p-5">
      <h2 id={id} className="label scroll-mt-6">
        {titel}
      </h2>
      {children}
    </Karte>
  );
}

export function Liste({ leer, children }: { leer: string; children: ReactNode[] }) {
  if (children.length === 0) return <p className="text-sm text-faint">{leer}</p>;
  return <Karte className="divide-y divide-line">{children}</Karte>;
}

export function ListenZeile({ href, titel, unter, rechts }: { href: string; titel: ReactNode; unter?: ReactNode; rechts?: ReactNode }) {
  return (
    <Link href={href} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-3 hover:bg-raised/40">
      <span className="min-w-0">
        <span className="block text-sm text-text">{titel}</span>
        {unter && <span className="num block text-xs text-faint">{unter}</span>}
      </span>
      {rechts && <span className="num text-xs text-muted">{rechts}</span>}
    </Link>
  );
}
