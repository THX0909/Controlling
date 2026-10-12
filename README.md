# Controlling

Interne Web-App für Planung und Controlling von Beratungsprojekten: PT-Planung, Plan/Ist, Umsatz, Partnerkosten, Deckungsbeitrag, Auslastung.

Alle Daten im Repository sind fiktiv (Kunde A, Partner X, MA 1 …).

## Start

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # Unit-Tests (Vitest)
npm run typecheck
npm run build
```

## Stand

**Phase 1 – Prototyp:** Seed-Daten (`src/seed/daten.ts`), Stichtag Okt 2026, Jan–Sep abgeschlossen. Designsystem mit Energieleiste, XP-Leiste, Segmentleiste, ABC-Rang, Befehlspalette (⌘K), Tastenkürzel (`?` zeigt alle), abschaltbaren Animationen und hellem Theme.

**Navigation**

| Bereich | Seite | Inhalt |
|---|---|---|
| Auswertungen | Übersicht | Kennzahlen, Team-Auslastung, Umsatzziele, laufende Beauftragungen |
| | Auslastung | Heatmap MA × Monat: PT, darunter Auslastung in % |
| | Kundensicht | Umsatz Ist/Forecast vs. Ziel, DB, Reisekosten; Detail je Kunde |
| Stammdaten | Kunden & Projekte | Kunde → Projekt → Beauftragung → Zuordnung MA (inkl. Folgebeauftragung) |
| | Mitarbeiter | intern/extern, Einkaufssatz, Teilzeit |

**Datenspeicher (Übergang bis Datenbank):** Änderungen landen in `.daten/bestand.json` (nicht im Git). Fehlt die Datei, starten die Seed-Daten. Zurücksetzen: Datei löschen. Pfad über `DATEN_DATEI` änderbar. Noch ohne Login und Rollen – nur lokal bzw. im Codespace nutzen.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `src/domain/` | Fachlogik als reine Funktionen, ohne UI/DB, mit Tests |
| `src/seed/` | fiktive Testdaten |
| `src/lib/` | Datenzugriff (`holeStand`) und Sichten für die Seiten |
| `src/components/` | UI-Bausteine |
| `src/app/` | Seiten (Next.js App Router) |

## Rechenregeln

- Zahlen nur als Integer: Cent, PT in Hundertstel, Prozente in Basispunkten. Kaufmännisch gerundet in `teileGerundet`.
- **Umsatz** = PT-Umsatz + Reisekosten. T&M: PT × Tagessatz der Zuordnung. Festpreis: Festpreis × PT / Budget-PT (Leistungsfortschritt).
- **Reisekosten**: Regel des Kunden, je Zuordnung übersteuerbar. *Pro Tag*: Reisetage × Pauschale (ohne Angabe gilt jeder PT als Reisetag). *Pro Monat*: Pauschale je Zuordnung und Monat mit PT > 0.
- **Partnerkosten**: alle gültigen Regeln, deren Bezug (Kunde/Projekt/Beauftragung) passt, wirken additiv. % vom Umsatz (mit/ohne Reise), fix pro PT, Pauschale je aktivem Monat, Pauschale je Beauftragung (Startmonat).
- **DB** = Umsatz − Partnerkosten − Einkauf externer MA.
- **Gültiger Wert**: abgeschlossene Monate Ist, sonst Plan.
- **Forecast**: *sicher* = Ist + beauftragt; *gewichtet* = sicher + erwartet × Wahrscheinlichkeit; *Best Case* = alles inkl. Optionen.
- **Kapazität** = Arbeitstage (Mo–Fr ohne Feiertage BW) × Teilzeitfaktor − Abwesenheit.
- **Auslastung** = gebuchte PT / Kapazität; Optionen zählen nie.

## Noch nicht enthalten

- Plan-PT je Monat bearbeiten (Drag & Drop), Partner und Partnerregeln pflegen, Abwesenheiten pflegen
- Login, Rollen, Row Level Security, Audit-Log (Phase 2/5)

## Offene fachliche Punkte

- Partneranteil: Bezug Gesamtkunde vs. Projekt und Vorrang bei mehreren Ebenen (aktuell additiv)
- Hosting/Anbieter (EU)
- Festpreis: Umsatzrealisierung (aktuell nach PT-Fortschritt)
