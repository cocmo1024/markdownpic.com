"use client";

import { useSyncExternalStore } from "react";

type Appearance = "system" | "light" | "dark";
const KEY = "markdownpic.appearance";

function read(): Appearance {
  try { const value = localStorage.getItem(KEY); return value === "light" || value === "dark" ? value : "system"; } catch { return "system"; }
}
function apply(value: Appearance) {
  const root = document.documentElement;
  if (value === "system") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", value);
}
function subscribe(onChange: () => void) {
  // A choice made in another tab applies here too.
  const fromOtherTab = (event: StorageEvent) => { if (event.key === KEY) { apply(read()); onChange(); } };
  window.addEventListener("markdownpic:appearance", onChange);
  window.addEventListener("storage", fromOtherTab);
  return () => { window.removeEventListener("markdownpic:appearance", onChange); window.removeEventListener("storage", fromOtherTab); };
}

function choose(value: Appearance) {
  try { if (value === "system") localStorage.removeItem(KEY); else localStorage.setItem(KEY, value); } catch { /* storage unavailable: applies to this visit only */ }
  apply(value);
  window.dispatchEvent(new Event("markdownpic:appearance"));
}

/** System / Light / Dark for the workspace. Exported images keep their own themes. */
export function AppearanceSwitch() {
  const current = useSyncExternalStore(subscribe, read, () => "system" as Appearance);
  return <div className="appearance-switch" role="group" aria-label="Appearance">
    {(["system", "light", "dark"] as const).map(value => <button key={value} aria-pressed={current === value} onClick={() => choose(value)}>{value === "system" ? "Auto" : value === "light" ? "Light" : "Dark"}</button>)}
  </div>;
}
