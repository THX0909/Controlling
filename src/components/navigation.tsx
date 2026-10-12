"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Eintrag {
  href: string;
  text: string;
  taste?: string;
  /** noch nicht umgesetzt: Phase, in der es kommt */
  folgt?: string;
}

export const NAVIGATION: { gruppe: string; eintraege: Eintrag[] }[] = [
  {
    gruppe: "Auswertungen",
    eintraege: [
      { href: "/", text: "Übersicht", taste: "d" },
      { href: "/auslastung", text: "Auslastung", taste: "a" },
      { href: "/kunden", text: "Kundensicht", taste: "k" },
    ],
  },
  {
    gruppe: "Stammdaten",
    eintraege: [
      { href: "/stammdaten/kunden", text: "Kunden & Projekte", taste: "s" },
      { href: "/stammdaten/mitarbeiter", text: "Mitarbeiter", taste: "m" },
    ],
  },
  {
    gruppe: "Folgt",
    eintraege: [
      { href: "#", text: "Monatsabschluss", folgt: "Phase 3" },
      { href: "#", text: "Forecast & DB", folgt: "Phase 4" },
      { href: "#", text: "Partner", folgt: "Phase 4" },
      { href: "#", text: "Kennzahlen", folgt: "Phase 4" },
    ],
  },
];

function istAktiv(pfad: string, href: string) {
  if (href === "/") return pfad === "/";
  // /kunden darf nicht bei /stammdaten/kunden aktiv werden
  return pfad === href || pfad.startsWith(`${href}/`);
}

export function Navigation() {
  const pfad = usePathname();
  return (
    <nav className="flex gap-4 lg:flex-col lg:gap-5" aria-label="Hauptnavigation">
      {NAVIGATION.map((g) => (
        <div key={g.gruppe} className={`flex gap-1 lg:flex-col ${g.gruppe === "Folgt" ? "hidden lg:flex" : ""}`}>
          <div className="label hidden px-2.5 pb-1 lg:block">{g.gruppe}</div>
          {g.eintraege.map((e) =>
            e.folgt ? (
              <span
                key={e.text}
                className="flex items-center justify-between gap-3 whitespace-nowrap rounded-md px-2.5 py-1 text-sm text-faint"
                title={`Kommt in ${e.folgt}`}
              >
                {e.text}
                <span className="text-[0.625rem]">{e.folgt.replace("Phase ", "P")}</span>
              </span>
            ) : (
              <Link
                key={e.href}
                href={e.href}
                aria-current={istAktiv(pfad, e.href) ? "page" : undefined}
                className={`group flex shrink-0 items-center justify-between gap-3 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm ${
                  istAktiv(pfad, e.href) ? "bg-raised text-text" : "text-muted hover:text-text"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${istAktiv(pfad, e.href) ? "bg-accent" : "bg-faint"}`} />
                  {e.text}
                </span>
                {e.taste && <kbd className="hidden opacity-0 group-hover:opacity-100 lg:inline">g {e.taste}</kbd>}
              </Link>
            ),
          )}
        </div>
      ))}
    </nav>
  );
}
