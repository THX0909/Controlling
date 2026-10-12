"use client";

import { MotionConfig } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "dark" | "light";

interface Einstellungen {
  animationen: boolean;
  setAnimationen: (an: boolean) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const Kontext = createContext<Einstellungen | null>(null);

function lies(schluessel: string): string | null {
  try {
    return localStorage.getItem(schluessel);
  } catch {
    return null;
  }
}

function schreib(schluessel: string, wert: string) {
  try {
    localStorage.setItem(schluessel, wert);
  } catch {
    /* Speicher nicht verfügbar – Einstellung gilt nur für diese Sitzung */
  }
}

/** Setzt Theme/Motion vor dem ersten Paint, um Flackern zu vermeiden. */
export const FRUEH_SKRIPT = `try{var d=document.documentElement;d.dataset.theme=localStorage.getItem("ct-theme")||"dark";d.dataset.motion=localStorage.getItem("ct-motion")||"on"}catch(e){}`;

export function EinstellungenProvider({ children }: { children: ReactNode }) {
  const [animationen, setAnimationenState] = useState(true);
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    setAnimationenState(lies("ct-motion") !== "off");
    setThemeState(lies("ct-theme") === "light" ? "light" : "dark");
  }, []);

  const setAnimationen = useCallback((an: boolean) => {
    setAnimationenState(an);
    document.documentElement.dataset.motion = an ? "on" : "off";
    schreib("ct-motion", an ? "on" : "off");
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.dataset.theme = t;
    schreib("ct-theme", t);
  }, []);

  return (
    <Kontext.Provider value={{ animationen, setAnimationen, theme, setTheme }}>
      <MotionConfig reducedMotion={animationen ? "user" : "always"}>{children}</MotionConfig>
    </Kontext.Provider>
  );
}

export function useEinstellungen(): Einstellungen {
  const k = useContext(Kontext);
  if (!k) throw new Error("useEinstellungen außerhalb von EinstellungenProvider");
  return k;
}
