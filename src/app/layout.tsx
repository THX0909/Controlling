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

export default async function RootLayout({ children }: { children: ReactNode }) {
  const kunden = (await holeStand()).db.kunden.map((k) => ({ id: k.id, name: k.name }));
  return (
    <html lang="de" data-theme="dark" data-motion="on" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: FRUEH_SKRIPT }} />
      </head>
      <body className="min-h-screen">
        <EinstellungenProvider>
          <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col lg:flex-row">
            <aside className="flex shrink-0 items-center gap-3 overflow-x-auto border-b border-line px-4 py-3 lg:sticky lg:top-0 lg:h-screen lg:w-52 lg:shrink-0 lg:flex-col lg:items-stretch lg:justify-start lg:overflow-y-auto lg:border-b-0 lg:border-r lg:px-3 lg:py-5">
              <div className="flex shrink-0 items-center gap-2 px-1 lg:mb-6">
                <span className="h-2.5 w-2.5 rotate-45 bg-accent" aria-hidden />
                <span className="hidden text-sm font-medium tracking-tight sm:inline">Controlling</span>
              </div>
              <Navigation />
              <div className="hidden space-y-2 px-1 lg:mt-auto lg:block">
                <div className="label">Stichtag</div>
                <div className="num text-sm">{monatLang(AKTUELLER_MONAT)}</div>
                <div className="pt-3 text-xs text-faint">
                  <kbd>⌘K</kbd> Befehle · <kbd>?</kbd> Hilfe
                </div>
              </div>
            </aside>
            <main className="min-w-0 flex-1 px-4 py-6 md:px-8 lg:px-10 lg:py-8">{children}</main>
          </div>
          <Befehlspalette kunden={kunden} />
        </EinstellungenProvider>
      </body>
    </html>
  );
}
