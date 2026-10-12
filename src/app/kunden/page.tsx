import Link from "next/link";
import { Karte, Rang, SeitenKopf, Umschalter } from "@/components/basis";
import { Legende, XpLeiste } from "@/components/leisten";
import { dbQuote } from "@/domain/forecast";
import { formatEuroKurz, formatProzent, quoteBp } from "@/domain/zahl";
import { holeStand, JAHR } from "@/lib/daten";
import { kundenSicht, leseSzenario, SZENARIEN } from "@/lib/sichten";

export default async function KundenSeite({ searchParams }: { searchParams: Promise<{ szenario?: string }> }) {
  const szenario = leseSzenario((await searchParams).szenario);
  const zeilen = kundenSicht(holeStand(), JAHR, szenario).sort(
    (a, b) => a.kunde.abc.localeCompare(b.kunde.abc) || a.kunde.name.localeCompare(b.kunde.name),
  );
  const fcSpalte = { sicher: "sicherCent", gewichtet: "gewichtetCent", best: "bestCent" } as const;

  return (
    <div className="space-y-6">
      <SeitenKopf
        titel="Kunden"
        unter={`Umsatz ${JAHR}: Ist + Forecast gegen Ziel. Reisekosten separat ausgewiesen.`}
        rechts={
          <Umschalter
            aktiv={szenario}
            optionen={SZENARIEN.map((s) => ({ wert: s.wert, text: s.text, href: `/kunden?szenario=${s.wert}` }))}
          />
        }
      />

      <Karte className="overflow-x-auto">
        <table className="w-full min-w-[60rem] text-sm">
          <thead>
            <tr className="label border-b border-line text-left">
              <th className="px-4 py-2.5 font-normal">Kunde</th>
              <th className="w-[22%] px-4 py-2.5 font-normal">Ziel</th>
              <th className="px-3 py-2.5 text-right font-normal">Ist</th>
              <th className="px-3 py-2.5 text-right font-normal">Forecast</th>
              <th className="px-3 py-2.5 text-right font-normal">Ziel</th>
              <th className="px-3 py-2.5 text-right font-normal">Erreicht</th>
              <th className="px-3 py-2.5 text-right font-normal">davon Reise</th>
              <th className="px-3 py-2.5 text-right font-normal">DB</th>
              <th className="px-4 py-2.5 text-right font-normal">DB-Quote</th>
            </tr>
          </thead>
          <tbody className="num divide-y divide-line">
            {zeilen.map((z) => (
              <tr key={z.kunde.id} className="hover:bg-raised/40">
                <td className="px-4 py-3 font-sans">
                  <Link href={`/kunden/${z.kunde.id}?szenario=${szenario}`} className="flex items-center gap-3 hover:text-accent">
                    <Rang abc={z.kunde.abc} />
                    {z.kunde.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <XpLeiste istCent={z.istCent} sicherCent={z.sicherCent} gewichtetCent={z.gewichtetCent} zielCent={z.zielCent} hoehe="h-2" />
                </td>
                <td className="px-3 py-3 text-right">{formatEuroKurz(z.istCent)}</td>
                <td className="px-3 py-3 text-right">{formatEuroKurz(z[fcSpalte[szenario]])}</td>
                <td className="px-3 py-3 text-right text-muted">{z.zielCent ? formatEuroKurz(z.zielCent) : "–"}</td>
                <td className="px-3 py-3 text-right">{z.zielCent ? formatProzent(quoteBp(z[fcSpalte[szenario]], z.zielCent)) : "–"}</td>
                <td className="px-3 py-3 text-right text-muted">{formatEuroKurz(z.summen.reiseCent)}</td>
                <td className="px-3 py-3 text-right">{formatEuroKurz(z.summen.dbCent)}</td>
                <td className="px-4 py-3 text-right">{formatProzent(dbQuote(z.summen), 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Karte>
      <Legende
        eintraege={[
          { art: "voll", text: "Ist" },
          { art: "schraffur", text: "sicherer Forecast" },
          { art: "geist", text: "gewichteter Forecast" },
        ]}
      />
      <p className="text-xs text-faint">Sortiert nach Kategorie und Name. Ohne Ziel skaliert die Leiste auf den gewichteten Forecast.</p>
    </div>
  );
}
