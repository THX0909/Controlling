import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Befehlspalette } from "@/components/befehle";
import { EinstellungenProvider, FRUEH_SKRIPT } from "@/components/einstellungen";
import { Navigation } from "@/components/navigation";
import { monatLang } from "@/domain/monat";
import { AKTUELLER_MONAT, holeStand } from "@/lib/daten";
import "./globals.css";

export const metadata: Metadata = {
  title: "Controlling",
  description: "Planung und Controlling von Beratungsprojekten",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0b0d10" };

export default function RootLayout({ children }: { children: ReactNode }) {
  const kunden = holeStand().db.kunden.map((k) => ({ id: k.id, name: k.name }));
  return (
    <html lang="de" data-theme="dark" data-motion="on" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: FRUEH_SKRIPT }} />
      </head>
      <body className="min-h-screen">
        <EinstellungenProvider>
          <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col md:flex-row">
            <aside className="flex shrink-0 items-center gap-3 overflow-x-auto border-b border-line px-4 py-3 md:sticky md:top-0 md:h-screen md:w-52 md:flex-col md:items-stretch md:justify-start md:border-b-0 md:border-r md:px-3 md:py-5">
              <div className="flex items-center gap-2 px-1 md:mb-6">
                <span className="h-2.5 w-2.5 rotate-45 bg-accent" aria-hidden />
                <span className="hidden text-sm font-medium tracking-tight sm:inline">Controlling</span>
              </div>
              <Navigation />
              <div className="hidden space-y-2 px-1 md:mt-auto md:block">
                <div className="label">Stichtag</div>
                <div className="num text-sm">{monatLang(AKTUELLER_MONAT)}</div>
                <div className="pt-3 text-xs text-faint">
                  <kbd>⌘K</kbd> Befehle · <kbd>?</kbd> Hilfe
                </div>
              </div>
            </aside>
            <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-8">{children}</main>
          </div>
          <Befehlspalette kunden={kunden} />
        </EinstellungenProvider>
      </body>
    </html>
  );
}
