import Link from "next/link";
import { notFound } from "next/navigation";
import { Abschnitt, Karte, Kennzahl, Rang, SeitenKopf, Umschalter } from "@/components/basis";
import { BeauftragungZeile } from "@/components/beauftragung-zeile";
import { Legende, XpLeiste } from "@/components/leisten";
import { dbQuote, summiere } from "@/domain/forecast";
import { monatKurz, monateImJahr } from "@/domain/monat";
import type { PartnerRegel, Reiseregel } from "@/domain/typen";
import { formatEuro, formatEuroKurz, formatProzent, formatPt, quoteBp } from "@/domain/zahl";
import { holeStand, JAHR, LETZTER_ABSCHLUSS } from "@/lib/daten";
import { beauftragungsSicht, kundenSicht, leseSzenario, SZENARIEN } from "@/lib/sichten";

function reiseText(r: Reiseregel): string {
  switch (r.art) {
    case "keine":
      return "keine Reisekosten";
    case "pro_tag":
      return `${formatEuro(r.cent)} pro Reisetag`;
    case "pro_monat":
      return `${formatEuro(r.cent)} pro Monat`;
  }
}

function regelText(r: PartnerRegel): string {
  const basis = r.basis === "mit_reise" ? "inkl. Reise" : "ohne Reise";
  switch (r.art.typ) {
    case "prozent":
      return `${formatProzent(r.art.bp, 1)} vom Umsatz (${basis})`;
    case "fix_pro_pt":
      return `${formatEuro(r.art.cent)} pro PT`;
    case "pauschale_monat":
      return `${formatEuro(r.art.cent)} pro Monat`;
    case "pauschale_beauftragung":
      return `${formatEuro(r.art.cent)} je Beauftragung`;
  }
}

export default async function KundeSeite({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ szenario?: string }>;
}) {
  const { id } = await params;
  const szenario = leseSzenario((await searchParams).szenario);
  const stand = await holeStand();
  const kunde = stand.index.kunde.get(id);
  if (!kunde) notFound();

  const sicht = kundenSicht(stand, JAHR, szenario).find((k) => k.kunde.id === id)!;
  const s = sicht.summen;
  const monate = monateImJahr(JAHR).map((m) => ({
    monat: m,
    ist: m <= LETZTER_ABSCHLUSS,
    summen: summiere(stand.zeilen, stand.posten, szenario, { kundeId: id, monate: [m] }),
  }));
  const beauftragungen = beauftragungsSicht(stand, id);
  const projektIds = new Set(stand.db.projekte.filter((p) => p.kundeId === id).map((p) => p.id));
  const beauftragungIds = new Set(beauftragungen.map((b) => b.beauftragung.id));
  const regeln = stand.db.partnerRegeln.filter(
    (r) =>
      (r.bezug.typ === "kunde" && r.bezug.id === id) ||
      (r.bezug.typ === "projekt" && projektIds.has(r.bezug.id)) ||
      (r.bezug.typ === "beauftragung" && beauftragungIds.has(r.bezug.id)),
  );

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <Link href={`/kunden?szenario=${szenario}`} className="text-xs text-muted hover:text-text">
          ← Kundensicht
        </Link>
        <SeitenKopf
          titel={kunde.name}
          unter={
            <span className="inline-flex items-center gap-3">
              <Rang abc={kunde.abc} />
              <span>{reiseText(kunde.reiseregel)}</span>
              <Link href={`/stammdaten/kunden/${id}`} className="text-xs hover:text-text">
                Stammdaten bearbeiten →
              </Link>
            </span>
          }
          rechts={
            <Umschalter
              aktiv={szenario}
              optionen={SZENARIEN.map((x) => ({ wert: x.wert, text: x.text, href: `/kunden/${id}?szenario=${x.wert}` }))}
            />
          }
        />
      </div>

      <Karte className="space-y-3 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="label">Umsatzziel {JAHR}</span>
          <span className="num text-sm text-muted">
            {sicht.zielCent ? (
              <>
                <span className="text-text">{formatProzent(quoteBp(sicht.gewichtetCent, sicht.zielCent))}</span> gewichtet von{" "}
                {formatEuroKurz(sicht.zielCent)}
              </>
            ) : (
              "kein Ziel hinterlegt"
            )}
          </span>
        </div>
        <XpLeiste istCent={sicht.istCent} sicherCent={sicht.sicherCent} gewichtetCent={sicht.gewichtetCent} zielCent={sicht.zielCent} hoehe="h-4" />
        <div className="num grid grid-cols-2 gap-2 text-xs text-muted sm:grid-cols-4">
          <span>Ist <span className="text-text">{formatEuroKurz(sicht.istCent)}</span></span>
          <span>Sicher <span className="text-text">{formatEuroKurz(sicht.sicherCent)}</span></span>
          <span>Gewichtet <span className="text-text">{formatEuroKurz(sicht.gewichtetCent)}</span></span>
          <span>Best Case <span className="text-text">{formatEuroKurz(sicht.bestCent)}</span></span>
        </div>
      </Karte>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kennzahl label="Umsatz" wert={formatEuroKurz(s.umsatzCent)} unter={`${formatPt(s.pt100)} PT`} />
        <Kennzahl label="davon Reise" wert={formatEuroKurz(s.reiseCent)} />
        <Kennzahl label="Partnerkosten" wert={formatEuroKurz(s.partnerCent)} />
        <Kennzahl label="Einkauf extern" wert={formatEuroKurz(s.einkaufCent)} />
        <Kennzahl label="DB" wert={formatEuroKurz(s.dbCent)} />
        <Kennzahl label="DB-Quote" wert={formatProzent(dbQuote(s), 1)} />
      </div>

      <Abschnitt titel="Monate">
        <Karte className="overflow-x-auto">
          <table className="num w-full min-w-[48rem] text-sm">
            <thead>
              <tr className="label border-b border-line text-right">
                <th className="px-4 py-2.5 text-left font-normal">Monat</th>
                <th className="px-3 py-2.5 font-normal">PT</th>
                <th className="px-3 py-2.5 font-normal">PT-Umsatz</th>
                <th className="px-3 py-2.5 font-normal">Reise</th>
                <th className="px-3 py-2.5 font-normal">Partner</th>
                <th className="px-3 py-2.5 font-normal">Einkauf</th>
                <th className="px-3 py-2.5 font-normal">DB</th>
                <th className="px-4 py-2.5 font-normal">DB-Quote</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-right">
              {monate.map(({ monat, ist, summen: m }) => (
                <tr key={monat} className={m.umsatzCent === 0 ? "text-faint" : ""}>
                  <td className="px-4 py-2 text-left">
                    {monatKurz(monat)} <span className={`ml-2 text-[0.6875rem] ${ist ? "text-ok" : "text-faint"}`}>{ist ? "Ist" : "FC"}</span>
                  </td>
                  <td className="px-3 py-2">{formatPt(m.pt100)}</td>
                  <td className="px-3 py-2">{formatEuro(m.ptUmsatzCent)}</td>
                  <td className="px-3 py-2 text-muted">{formatEuro(m.reiseCent)}</td>
                  <td className="px-3 py-2 text-muted">{formatEuro(m.partnerCent)}</td>
                  <td className="px-3 py-2 text-muted">{formatEuro(m.einkaufCent)}</td>
                  <td className="px-3 py-2">{formatEuro(m.dbCent)}</td>
                  <td className="px-4 py-2">{formatProzent(dbQuote(m), 1)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-line text-right text-text">
                <td className="px-4 py-2.5 text-left label">Summe</td>
                <td className="px-3 py-2.5">{formatPt(s.pt100)}</td>
                <td className="px-3 py-2.5">{formatEuro(s.ptUmsatzCent)}</td>
                <td className="px-3 py-2.5">{formatEuro(s.reiseCent)}</td>
                <td className="px-3 py-2.5">{formatEuro(s.partnerCent)}</td>
                <td className="px-3 py-2.5">{formatEuro(s.einkaufCent)}</td>
                <td className="px-3 py-2.5">{formatEuro(s.dbCent)}</td>
                <td className="px-4 py-2.5">{formatProzent(dbQuote(s), 1)}</td>
              </tr>
            </tfoot>
          </table>
        </Karte>
        <p className="text-xs text-faint">Ist = abgeschlossener Monat · FC = Forecast im gewählten Szenario.</p>
      </Abschnitt>

      <Abschnitt titel="Beauftragungen">
        <Karte className="divide-y divide-line px-4">
          {beauftragungen.map((z) => (
            <BeauftragungZeile key={z.beauftragung.id} zeile={z} />
          ))}
        </Karte>
        <Legende
          eintraege={[
            { art: "voll", text: "verbraucht (Ist)" },
            { art: "schraffur", text: "geplant" },
            { art: "crit", text: "über Budget" },
          ]}
        />
      </Abschnitt>

      {regeln.length > 0 && (
        <Abschnitt titel="Partnerregeln">
          <Karte className="divide-y divide-line px-4 text-sm">
            {regeln.map((r) => (
              <div key={r.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
                <span>
                  {stand.db.partner.find((p) => p.id === r.partnerId)?.name}
                  <span className="ml-2 text-xs text-faint">
                    Bezug {r.bezug.typ}
                    {r.bezug.typ !== "kunde" && `: ${r.bezug.typ === "projekt" ? stand.index.projekt.get(r.bezug.id)?.name : stand.index.beauftragung.get(r.bezug.id)?.name}`}
                  </span>
                </span>
                <span className="num text-xs text-muted">
                  {regelText(r)} · ab {r.gueltigVon}
                  {r.gueltigBis ? ` bis ${r.gueltigBis}` : ""}
                </span>
              </div>
            ))}
          </Karte>
        </Abschnitt>
      )}
    </div>
  );
}
