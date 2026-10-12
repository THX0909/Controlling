"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const EINTRAEGE = [
  { href: "/", text: "Dashboard", taste: "d" },
  { href: "/auslastung", text: "Auslastung", taste: "a" },
  { href: "/kunden", text: "Kunden", taste: "k" },
];

export function Navigation() {
  const pfad = usePathname();
  return (
    <nav className="flex gap-1 md:flex-col" aria-label="Hauptnavigation">
      {EINTRAEGE.map((e) => {
        const aktiv = e.href === "/" ? pfad === "/" : pfad.startsWith(e.href);
        return (
          <Link
            key={e.href}
            href={e.href}
            aria-current={aktiv ? "page" : undefined}
            className={`group flex items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-sm ${
              aktiv ? "bg-raised text-text" : "text-muted hover:text-text"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${aktiv ? "bg-accent" : "bg-faint"}`} />
              {e.text}
            </span>
            <kbd className="hidden opacity-0 group-hover:opacity-100 md:inline">g {e.taste}</kbd>
          </Link>
        );
      })}
    </nav>
  );
}
