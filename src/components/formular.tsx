"use client";

import { startTransition, useActionState, useEffect, useRef, type ReactNode } from "react";
import type { Ergebnis } from "@/app/stammdaten/aktionen";

type Aktion = (vorher: Ergebnis, fd: FormData) => Promise<Ergebnis>;

/**
 * Formular mit Server-Aktion. Eingaben bleiben bei Fehlern erhalten;
 * `zuruecksetzen` leert das Formular nach Erfolg (für "Neu anlegen").
 */
export function Formular({
  aktion,
  knopf,
  children,
  bestaetigen,
  zuruecksetzen = false,
  gefahr = false,
  className = "",
}: {
  aktion: Aktion;
  knopf: string;
  children?: ReactNode;
  bestaetigen?: string;
  zuruecksetzen?: boolean;
  gefahr?: boolean;
  className?: string;
}) {
  const [zustand, ausloesen, laeuft] = useActionState(aktion, undefined);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (zustand?.ok && zuruecksetzen) ref.current?.reset();
  }, [zustand, zuruecksetzen]);

  return (
    <form
      ref={ref}
      className={`space-y-3 ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (bestaetigen && !window.confirm(bestaetigen)) return;
        const fd = new FormData(e.currentTarget);
        startTransition(() => ausloesen(fd));
      }}
    >
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={laeuft}
          className={`rounded-md px-3 py-1.5 text-sm disabled:opacity-50 ${
            gefahr
              ? "border border-crit/40 text-crit hover:bg-crit/10"
              : "bg-accent font-medium text-bg hover:brightness-110"
          }`}
        >
          {laeuft ? "…" : knopf}
        </button>
        <span aria-live="polite" className="text-sm">
          {zustand?.fehler && <span className="text-crit">{zustand.fehler}</span>}
          {zustand?.ok && !laeuft && <span className="text-ok">{zustand.ok}</span>}
        </span>
      </div>
    </form>
  );
}
