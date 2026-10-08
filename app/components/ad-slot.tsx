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

type Mode = "off" | "preview" | "live";

/**
 * A reserved, labelled ad unit. It requests an ad only while visible at the given media query,
 * and shows `fallback` when AdSense reports no fill, so the space never looks broken.
 */
export function AdSlot({ slot, media, className = "", fallback }: { slot: keyof typeof adsense.slots; media?: string; className?: string; fallback?: ReactNode }) {
  const [mode, setMode] = useState<Mode>("off");
  const [unfilled, setUnfilled] = useState(false);
  const unit = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!adsense.enabled) return;
    const query = media ? window.matchMedia(media) : null;
    const update = () => setMode(query && !query.matches ? "off" : isLocalHost(location.hostname) ? "preview" : "live");
    update();
    query?.addEventListener("change", update);
    return () => query?.removeEventListener("change", update);
  }, [media]);

  useEffect(() => {
    const element = unit.current;
    if (mode !== "live" || !element) return;
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
    return () => { cancelIdle(pending); watch.disconnect(); };
  }, [mode]);

  if (mode === "off") return null;
  return <aside className={"ad-slot ad-slot-" + slot + (unfilled ? " is-unfilled" : "") + (className ? " " + className : "")} aria-label="Advertisement">
    <span className="ad-label">Advertisement</span>
    {mode === "preview"
      ? <div className="ad-preview" aria-hidden="true">Ad · {slot}</div>
      : <ins ref={unit} className="adsbygoogle" style={{ display: "block" }} data-ad-client={adsense.client} data-ad-slot={adsense.slots[slot]} data-ad-format="auto" data-full-width-responsive="true" />}
    {unfilled && fallback}
  </aside>;
}
