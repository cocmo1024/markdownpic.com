"use client";

import { useRef, useState } from "react";
import { emptyBrand, hasBrand, prepareAvatar, saveBrand, type BrandKit } from "@/lib/brand-kit";
import type { Design } from "@/lib/studio-model";
import { useBrand } from "./use-brand";
import { Icon } from "./icons";

/** "My brand" in Customize: who every image is from, saved once in this browser. */
export function BrandSection({ design, setDesign }: { design: Design; setDesign: (patch: Partial<Design>) => void }) {
  const saved = useBrand();
  const [draft, setDraft] = useState<BrandKit>(() => saved ?? emptyBrand);
  const [message, setMessage] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const update = (patch: Partial<BrandKit>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    try { saveBrand(next); setMessage(""); } catch (error) { setMessage(error instanceof Error ? error.message : "The brand could not be saved."); }
  };
  const brandStyleApplied = design.accent === draft.accent && design.theme === draft.theme && design.fontFamily === draft.font;

  return <section className="brand-section" aria-labelledby="brand-title">
    <div className="brand-head"><h3 id="brand-title">My brand</h3><small>Saved in this browser. Added to every image.</small></div>
    <div className="brand-identity">
      <button className="brand-avatar" title={draft.avatar ? "Change avatar" : "Add avatar"} aria-label={draft.avatar ? "Change avatar" : "Add avatar"} onClick={() => file.current?.click()}>
        {/* A local data URL; no image optimizer applies. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {draft.avatar ? <img src={draft.avatar} alt="" /> : <Icon name="plus" />}
      </button>
      <div className="brand-fields">
        <input aria-label="Your name" placeholder="Your name" maxLength={60} value={draft.name} onChange={event => update({ name: event.target.value })} />
        <input aria-label="Handle or website" placeholder="@handle or website" maxLength={60} value={draft.handle} onChange={event => setDraft({ ...draft, handle: event.target.value })} onBlur={event => update({ handle: event.target.value })} />
      </div>
    </div>
    {draft.avatar && <button className="link-button" onClick={() => update({ avatar: "" })}>Remove avatar</button>}
    <input ref={file} type="file" className="sr-only" tabIndex={-1} accept="image/png,image/jpeg,image/webp" aria-label="Choose an avatar image" onChange={event => {
      const chosen = event.target.files?.[0]; event.target.value = "";
      if (chosen) void prepareAvatar(chosen).then(avatar => update({ avatar }), error => setMessage(error instanceof Error ? error.message : "That image could not be used."));
    }} />
    {hasBrand(draft) && <>
      <fieldset><legend>Byline on this image</legend><div className="choice-row compact">{(["top", "bottom", "none"] as const).map(position => <button key={position} aria-pressed={design.byline === position} onClick={() => setDesign({ byline: position })}>{position === "top" ? "Top" : position === "bottom" ? "Bottom" : "Hidden"}</button>)}</div></fieldset>
      <div className="brand-style">
        <span className="brand-swatch" style={{ background: draft.accent }} aria-hidden="true" />
        <span>Brand style: {draft.theme === emptyBrand.theme && draft.accent === emptyBrand.accent && draft.font === emptyBrand.font ? "not saved yet" : "color, theme and typeface"}</span>
        <button onClick={() => { update({ accent: design.accent, theme: design.theme, font: design.fontFamily }); setMessage("This image’s color, theme and typeface are now your brand style."); }}>Save current</button>
        <button className="primary-button" disabled={brandStyleApplied} onClick={() => setDesign({ accent: draft.accent, theme: draft.theme, fontFamily: draft.font })}>Apply</button>
      </div>
    </>}
    {message && <p className="brand-message" role="status">{message}</p>}
  </section>;
}
