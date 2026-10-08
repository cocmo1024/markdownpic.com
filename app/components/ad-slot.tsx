"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { adsense } from "@/lib/site-config";

declare global { interface Window { adsbygoogle?: unknown[] } }

const SCRIPT_ID = "adsbygoogle-loader";
const isLocalHost = (host: string) => /^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$|\.test$/.test(host);

function loadScript() {
  if (document.getElementById(SCRIPT_ID)) return;
  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + adsense.client;
  document.head.appendChild(script);
}

/**
 * AdSense may write `height: auto !important` onto an ad's ancestors, which collapses the
 * full-height workbench. Any sizing it adds to an ancestor is removed again immediately.
 */
function protectAncestors(element: HTMLElement) {
  const ancestors: HTMLElement[] = [];
  for (let node = element.parentElement; node && node !== document.body; node = node.parentElement) ancestors.push(node);
  const owned = new Map(ancestors.map(node => [node, node.getAttribute("style")]));
  const restore = () => {
    for (const [node, original] of owned) {
      if (node.getAttribute("style") === original) continue;
      for (const property of ["height", "min-height", "max-height"]) {
        if (!original?.includes(property)) node.style.removeProperty(property);
      }
    }
  };
  const observer = new MutationObserver(restore);
  for (const node of ancestors) observer.observe(node, { attributes: true, attributeFilter: ["style"] });
  return () => observer.disconnect();
}

type Mode = "off" | "preview" | "live";
export type AdSize = { media: string; width: number; height: number };

/**
 * A reserved, labelled ad unit. It requests an ad only while visible at the given media query,
 * and shows `fallback` when AdSense reports no fill, so the space never looks broken.
 * With `sizes`, the unit is requested at a fixed size (the first matching media query).
 */
export function AdSlot({ slot, media, sizes, className = "", fallback }: { slot: keyof typeof adsense.slots; media?: string; sizes?: AdSize[]; className?: string; fallback?: ReactNode }) {
  const [mode, setMode] = useState<Mode>("off");
  const [size, setSize] = useState<AdSize | null>(null);
  const [unfilled, setUnfilled] = useState(false);
  const unit = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!adsense.enabled) return;
    const queries = [media, ...(sizes ?? []).map(item => item.media)].filter(Boolean).map(query => window.matchMedia(query!));
    const update = () => {
      const visible = !media || window.matchMedia(media).matches;
      setMode(!visible ? "off" : isLocalHost(location.hostname) ? "preview" : "live");
      setSize(sizes?.find(item => window.matchMedia(item.media).matches) ?? null);
    };
    update();
    for (const query of queries) query.addEventListener("change", update);
    return () => { for (const query of queries) query.removeEventListener("change", update); };
  }, [media, sizes]);

  useEffect(() => {
    const element = unit.current;
    if (mode !== "live" || !element) return;
    const release = protectAncestors(element);
    const watch = new MutationObserver(() => setUnfilled(element.dataset.adStatus === "unfilled"));
    watch.observe(element, { attributes: true, attributeFilter: ["data-ad-status"] });
    // The ad loader waits until the editor is interactive.
    const idle = window.requestIdleCallback ?? ((callback: () => void) => window.setTimeout(callback, 1200));
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;
    const pending = idle(() => {
      loadScript();
      if (element.dataset.adsbygoogleStatus) return;
      // A blocked or failed loader is treated like an unfilled slot.
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch { element.dataset.adStatus = "unfilled"; }
    }, { timeout: 2500 });
    return () => { cancelIdle(pending); watch.disconnect(); release(); };
  }, [mode, size]);

  if (mode === "off") return null;
  const fixed = size ? { display: "inline-block", width: size.width, height: size.height } : { display: "block" };
  return <aside className={"ad-slot ad-slot-" + slot + (unfilled ? " is-unfilled" : "") + (className ? " " + className : "")} style={size ? { width: size.width + 33 } : undefined} aria-label="Advertisement">
    <span className="ad-label">Advertisement</span>
    {mode === "preview"
      ? <div className="ad-preview" style={size ? { width: size.width, height: size.height } : undefined} aria-hidden="true">Ad · {slot}{size ? " · " + size.width + "×" + size.height : ""}</div>
      : size
        // A new element per size: AdSense fills each <ins> only once.
        ? <ins key={size.width + "x" + size.height} ref={unit} className="adsbygoogle" style={fixed} data-ad-client={adsense.client} data-ad-slot={adsense.slots[slot]} />
        : <ins ref={unit} className="adsbygoogle" style={fixed} data-ad-client={adsense.client} data-ad-slot={adsense.slots[slot]} data-ad-format="auto" data-full-width-responsive="true" />}
    {unfilled && fallback}
  </aside>;
}
