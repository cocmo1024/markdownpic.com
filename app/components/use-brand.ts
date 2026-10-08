"use client";

import { useSyncExternalStore } from "react";
import { BRAND_KEY, loadBrand, type BrandKit } from "@/lib/brand-kit";

// One parsed snapshot per stored value, so React sees a stable object between changes.
let cachedRaw: string | null | undefined;
let cachedBrand: BrandKit | null = null;
function snapshot() {
  let raw: string | null = null;
  try { raw = localStorage.getItem(BRAND_KEY); } catch { /* storage unavailable */ }
  if (raw !== cachedRaw) { cachedRaw = raw; cachedBrand = raw ? loadBrand() : null; }
  return cachedBrand;
}
function subscribe(onChange: () => void) {
  const handle = (event: Event) => { if (!(event instanceof StorageEvent) || event.key === BRAND_KEY) onChange(); };
  window.addEventListener("storage", handle);
  window.addEventListener("markdownpic:brand", handle);
  return () => { window.removeEventListener("storage", handle); window.removeEventListener("markdownpic:brand", handle); };
}

/** The saved brand kit, shared across components and tabs; null until one is set up. Server render: null. */
export function useBrand() {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}
