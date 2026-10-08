"use client";
import { useEffect, useState } from "react";
import { Modal } from "./modal";
import { accents, canvasPresets, FONT_SCALE_MAX, FONT_SCALE_MIN, effectiveDesign, newId, themeFor, themeLook, themes, type BrandProfile, type Design, type Project } from "@/lib/studio-model";
import { listProfiles, saveProfile } from "@/lib/project-store";
import { BrandSection } from "./brand-section";

export function StylePanel({ project, index, apply, onFit, onClose, onDone }: { project: Project; index: number; apply: (updater: (current: Project) => Project) => void; onFit?: () => void; onClose: () => void; onDone: () => void }) {
  const [scope, setScope] = useState<"all" | "page">("all");
  const [profiles, setProfiles] = useState<BrandProfile[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const page = project.pages[index];
  const design = scope === "all" ? project.design : effectiveDesign(project, page);
  const setDesign = (patch: Partial<Design>) => apply(current => scope === "page" && current.mode === "carousel"
    ? { ...current, pages: current.pages.map((item, i) => i === index ? { ...item, design: { ...item.design, ...patch } } : item) }
    : { ...current, design: { ...current.design, ...patch } });
  useEffect(() => { void listProfiles().then(setProfiles).catch(() => setMessage("Saved styles are unavailable. You can still customize this project.")); }, []);
  return <Modal title="Customize your image" drawer onClose={onClose}><div className="settings-content">
    <BrandSection design={design} setDesign={setDesign} />
    {project.mode === "carousel" && <label>Apply changes to<select value={scope} onChange={event => setScope(event.target.value as typeof scope)}><option value="all">Project default</option><option value="page">This page only</option></select><small>Page overrides stay in place when the default changes.</small></label>}
    {scope === "page" && Object.keys(page.design).length > 0 && <button onClick={() => apply(current => ({ ...current, pages: current.pages.map((item, i) => i === index ? { ...item, design: {} } : item) }))}>Reset this page to project style</button>}
    <label>Canvas size<select value={design.presetId} onChange={event => setDesign({ presetId: event.target.value })}>{canvasPresets.map(item => <option key={item.id} value={item.id}>{item.label} · {item.width * design.renderScale} × {item.height ? item.height * design.renderScale : "auto"} px</option>)}</select></label>
    <fieldset><legend>Theme</legend><div className="theme-grid">{themes.map(theme => <button key={theme.id} title={theme.note} aria-label={theme.label + ": " + theme.note} aria-pressed={design.theme === theme.id} onClick={() => setDesign(themeLook(theme.id))}><span className={"theme-swatch theme-" + theme.id + " font-" + theme.font} style={{ background: theme.background, color: theme.color }}><b>Aa</b><i style={{ background: theme.accent }} /></span>{theme.label}</button>)}</div></fieldset>
    <fieldset><legend>Accent</legend><div className="accent-row">{[themeFor(design.theme).accent, ...accents.filter(accent => accent !== themeFor(design.theme).accent)].map((accent, i) => <button key={accent} className={"accent-swatch" + (i === 0 ? " is-theme" : "")} style={{ background: accent }} title={i === 0 ? "Theme accent" : undefined} aria-label={(i === 0 ? "Theme accent " : "Accent ") + accent} aria-pressed={design.accent.toLowerCase() === accent.toLowerCase()} onClick={() => setDesign({ accent })} />)}<label className="custom-color">Custom<input type="color" aria-label="Custom accent color" value={design.accent} onChange={event => setDesign({ accent: event.target.value })} /></label></div><small>Text contrast is adjusted automatically for readability.</small></fieldset>
    <fieldset><legend>Typeface</legend><div className="font-grid">{([["sans", "Sans", "Clear, modern"], ["serif", "Serif", "Editorial"], ["mono", "Mono", "Technical"]] as const).map(([id, label, note]) => <button key={id} aria-pressed={design.fontFamily === id} aria-label={label + " typeface"} onClick={() => setDesign({ fontFamily: id })}><span className={"font-sample font-" + id}>Ag</span><strong>{label}</strong><small>{note}</small></button>)}</div></fieldset>
    {([{ key: "fontScale", name: "Image text size", min: FONT_SCALE_MIN, max: FONT_SCALE_MAX, unit: "%" }, { key: "padding", name: "Canvas padding", min: 20, max: 80, unit: "px" }, { key: "imageMaxHeight", name: "Maximum image height", min: 100, max: 1200, unit: "px" }] as const).map(setting => <label key={setting.key} className="range-label" htmlFor={"design-" + setting.key}><span>{setting.name}<output>{design[setting.key]}{setting.unit}</output></span><input id={"design-" + setting.key} aria-label={setting.name} type="range" min={setting.min} max={setting.max} value={design[setting.key]} onChange={event => setDesign({ [setting.key]: Number(event.target.value) })} /></label>)}
    {onFit && design.presetId !== "long" && <button className="fit-button" onClick={() => { onClose(); onFit(); }}>Fit text to canvas</button>}
    <fieldset><legend>Alignment</legend><div className="choice-row compact">{([["left", "Left"], ["center", "Centered"]] as const).map(([id, label]) => <button key={id} aria-pressed={design.textAlign === id} onClick={() => setDesign({ textAlign: id })}>{label}</button>)}</div></fieldset>
    <fieldset><legend>Frame</legend><div className="choice-row compact">{([["none", "None"], ["gradient", "Gradient"], ["solid", "Tint"]] as const).map(([id, label]) => <button key={id} aria-pressed={design.frame === id} onClick={() => setDesign({ frame: id })}>{label}</button>)}</div><small>Sets the card on a backdrop in your accent color.</small></fieldset>
    <details><summary>Watermark & finishing touches</summary><div className="detail-content">
      <label className="check-label"><input type="checkbox" checked={design.smartTypography} onChange={event => setDesign({ smartTypography: event.target.checked })} />Typographic quotes and dashes</label>
      <label className="check-label"><input type="checkbox" checked={design.showHeader} onChange={event => setDesign({ showHeader: event.target.checked })} />Editorial header</label>
      <label className="check-label"><input type="checkbox" checked={design.showBrand} onChange={event => setDesign({ showBrand: event.target.checked })} />Made with MarkdownPic</label>
      <label>Watermark text<input maxLength={80} placeholder="@yourname or © 2026 Your Studio" value={design.watermarkText} onChange={event => setDesign({ watermarkText: event.target.value })} /></label>
      <label>Watermark position<select value={design.watermarkPosition} onChange={event => setDesign({ watermarkPosition: event.target.value as Design["watermarkPosition"] })}><option value="bottom-right">Bottom right</option><option value="top-right">Top right</option><option value="center">Center</option></select></label>
      <label className="range-label" htmlFor="design-watermarkOpacity"><span>Watermark opacity<output>{design.watermarkOpacity}%</output></span><input id="design-watermarkOpacity" aria-label="Watermark opacity" type="range" min={6} max={36} value={design.watermarkOpacity} onChange={event => setDesign({ watermarkOpacity: Number(event.target.value) })} /></label>
    </div></details>
    <details><summary>Reusable styles</summary><div className="detail-content"><label>Style name<input value={name} maxLength={60} placeholder="My brand" onChange={event => setName(event.target.value)} /></label><button disabled={!name.trim()} onClick={() => void saveProfile({ id: newId("style"), name: name.trim(), design: { ...design } }).then(async () => { setProfiles(await listProfiles()); setName(""); setMessage("Style saved in this browser."); }).catch(error => setMessage(error instanceof Error ? error.message : "Style could not be saved."))}>Save style in this browser</button>{profiles.map(profile => <button key={profile.id} onClick={() => setDesign(profile.design)}>{profile.name}</button>)}</div></details>
    {message && <p role="status">{message}</p>}
  </div><div className="modal-footer"><button className="primary-button" onClick={onDone}>Done</button></div></Modal>;
}
