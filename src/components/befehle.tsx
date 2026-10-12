"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useEinstellungen } from "./einstellungen";

interface Befehl {
  id: string;
  gruppe: string;
  text: string;
  kuerzel?: string;
  aktion: () => void;
}

const KUERZEL: [string, string][] = [
  ["⌘K / Strg K", "Befehlspalette"],
  ["g d", "Dashboard"],
  ["g a", "Auslastung"],
  ["g k", "Kunden"],
  ["m", "Animationen an/aus"],
  ["?", "Tastenkürzel"],
];

function istEingabe(ziel: EventTarget | null) {
  return ziel instanceof HTMLElement && (ziel.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(ziel.tagName));
}

export function Befehlspalette({ kunden }: { kunden: { id: string; name: string }[] }) {
  const router = useRouter();
  const { animationen, setAnimationen, theme, setTheme } = useEinstellungen();
  const [offen, setOffen] = useState(false);
  const [hilfe, setHilfe] = useState(false);
  const [suche, setSuche] = useState("");
  const [auswahl, setAuswahl] = useState(0);
  const eingabe = useRef<HTMLInputElement>(null);

  const befehle = useMemo<Befehl[]>(
    () => [
      { id: "nav-d", gruppe: "Navigation", text: "Dashboard", kuerzel: "g d", aktion: () => router.push("/") },
      { id: "nav-a", gruppe: "Navigation", text: "Auslastung", kuerzel: "g a", aktion: () => router.push("/auslastung") },
      { id: "nav-k", gruppe: "Navigation", text: "Kunden", kuerzel: "g k", aktion: () => router.push("/kunden") },
      ...kunden.map((k) => ({ id: `k-${k.id}`, gruppe: "Kunden", text: k.name, aktion: () => router.push(`/kunden/${k.id}`) })),
      { id: "anim", gruppe: "Einstellungen", text: animationen ? "Animationen aus" : "Animationen an", kuerzel: "m", aktion: () => setAnimationen(!animationen) },
      { id: "theme", gruppe: "Einstellungen", text: theme === "dark" ? "Helles Theme" : "Dunkles Theme", aktion: () => setTheme(theme === "dark" ? "light" : "dark") },
      { id: "hilfe", gruppe: "Einstellungen", text: "Tastenkürzel anzeigen", kuerzel: "?", aktion: () => setHilfe(true) },
    ],
    [router, kunden, animationen, setAnimationen, theme, setTheme],
  );

  const treffer = useMemo(() => {
    const s = suche.trim().toLowerCase();
    return s ? befehle.filter((b) => `${b.gruppe} ${b.text}`.toLowerCase().includes(s)) : befehle;
  }, [befehle, suche]);

  useEffect(() => setAuswahl(0), [suche]);

  useEffect(() => {
    let wartetAufG = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ziele: Record<string, string> = { d: "/", a: "/auslastung", k: "/kunden" };

    function taste(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setHilfe(false);
        setOffen((o) => !o);
        return;
      }
      if (e.key === "Escape") {
        eingabe.current?.blur();
        setOffen(false);
        setHilfe(false);
        return;
      }
      if (istEingabe(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (wartetAufG) {
        wartetAufG = false;
        const ziel = ziele[e.key];
        if (ziel) router.push(ziel);
        return;
      }
      if (e.key === "g") {
        wartetAufG = true;
        clearTimeout(timer);
        timer = setTimeout(() => (wartetAufG = false), 1000);
      } else if (e.key === "?") {
        setHilfe((h) => !h);
      } else if (e.key === "m") {
        setAnimationen(!animationen);
      }
    }
    window.addEventListener("keydown", taste);
    return () => {
      window.removeEventListener("keydown", taste);
      clearTimeout(timer);
    };
  }, [router, animationen, setAnimationen]);

  useEffect(() => {
    if (offen) {
      setSuche("");
      requestAnimationFrame(() => eingabe.current?.focus());
    }
  }, [offen]);

  function ausfuehren(b: Befehl | undefined) {
    if (!b) return;
    // Fokus sofort lösen: das Eingabefeld bleibt während der Ausblend-Animation im DOM
    eingabe.current?.blur();
    setOffen(false);
    b.aktion();
  }

  return (
    <AnimatePresence>
      {(offen || hilfe) && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-bg/70 px-4 pt-[14vh] backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setOffen(false);
              setHilfe(false);
            }
          }}
        >
          <motion.div
            className="w-full max-w-lg overflow-hidden rounded-lg border border-line bg-surface shadow-2xl"
            initial={{ y: -6, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -6, scale: 0.98 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-label={hilfe ? "Tastenkürzel" : "Befehlspalette"}
          >
            {hilfe ? (
              <div className="p-4">
                <div className="label mb-3">Tastenkürzel</div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                  {KUERZEL.map(([k, t]) => (
                    <div key={k} className="contents">
                      <dt><kbd>{k}</kbd></dt>
                      <dd className="text-muted">{t}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              <>
                <input
                  ref={eingabe}
                  value={suche}
                  onChange={(e) => setSuche(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setAuswahl((a) => Math.min(a + 1, treffer.length - 1));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setAuswahl((a) => Math.max(a - 1, 0));
                    } else if (e.key === "Enter") {
                      ausfuehren(treffer[auswahl]);
                    }
                  }}
                  placeholder="Befehl oder Kunde …"
                  className="w-full border-b border-line bg-transparent px-4 py-3 text-sm text-text outline-none placeholder:text-faint"
                  aria-label="Suche"
                />
                <ul className="max-h-80 overflow-y-auto py-1" role="listbox">
                  {treffer.length === 0 && <li className="px-4 py-3 text-sm text-muted">Keine Treffer</li>}
                  {treffer.map((b, i) => (
                    <li
                      key={b.id}
                      role="option"
                      aria-selected={i === auswahl}
                      onMouseEnter={() => setAuswahl(i)}
                      onClick={() => ausfuehren(b)}
                      className={`flex cursor-pointer items-center justify-between px-4 py-2 text-sm ${i === auswahl ? "bg-raised text-text" : "text-muted"}`}
                    >
                      <span>
                        <span className="mr-3 text-xs text-faint">{b.gruppe}</span>
                        {b.text}
                      </span>
                      {b.kuerzel && <kbd>{b.kuerzel}</kbd>}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
