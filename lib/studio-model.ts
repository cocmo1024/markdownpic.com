export type ThemeId = "editorial" | "mono" | "linen" | "mist" | "harbor" | "rose" | "swiss" | "citrus" | "midnight" | "ink" | "terminal" | "plum";
export type OutputMode = "single" | "carousel";
export type ImageFormat = "png" | "jpeg" | "webp";
export type FontFamily = "sans" | "serif" | "mono";
export type WatermarkPosition = "center" | "top-right" | "bottom-right";
/** Where the brand-kit byline (avatar, name, handle) sits; it only renders once a brand kit exists. */
export type BylinePosition = "bottom" | "top" | "none";
export type BylineAlign = "left" | "center" | "right";
/** A colored backdrop around the card, with rounded corners and a soft shadow. */
export type FrameStyle = "none" | "gradient" | "solid";

export interface CanvasPreset {
  id: string;
  label: string;
  width: number;
  height: number | null;
}

export interface Design {
  presetId: string;
  theme: ThemeId;
  accent: string;
  fontScale: number;
  fontFamily: FontFamily;
  padding: number;
  showBrand: boolean;
  showHeader: boolean;
  renderScale: 1 | 2 | 3;
  watermarkText: string;
  watermarkOpacity: number;
  watermarkPosition: WatermarkPosition;
  imageMaxHeight: number;
  byline: BylinePosition;
  bylineAlign: BylineAlign;
  bylineDivider: boolean;
  /** Curly quotes, en and em dashes, ellipses; never inside code or math. */
  smartTypography: boolean;
  frame: FrameStyle;
}

export interface StudioPage {
  id: string;
  markdown: string;
  design: Partial<Design>;
}

export interface Project {
  version: 2;
  id: string;
  name: string;
  pages: StudioPage[];
  design: Design;
  mode: OutputMode;
  createdAt: number;
  updatedAt: number;
  revision: number;
}

export interface BrandProfile { id: string; name: string; design: Design }

export const MAX_PAGES = 20;
export const MAX_TEXT_LENGTH = 120_000;
export const MAX_IMAGE_BYTES = 12_000_000;
export const MAX_IMAGE_PIXELS = 32_000_000;
export const PAGE_BREAK_MARKER = "<!-- page -->";
export const LEGACY_DRAFT_KEY = "markdownpic.studio-draft.v1";

export const canvasPresets: CanvasPreset[] = [
  { id: "long", label: "Auto height", width: 600, height: null },
  { id: "square", label: "Square", width: 540, height: 540 },
  { id: "portrait", label: "Portrait", width: 540, height: 675 },
  { id: "story", label: "Story", width: 540, height: 960 },
  { id: "social", label: "Landscape", width: 600, height: 315 },
  { id: "wide", label: "Wide 16:9", width: 640, height: 360 },
  { id: "tall", label: "Tall 3:4", width: 540, height: 720 },
];

/**
 * A theme is a complete look: canvas, ink, its own accent and a typeface pairing, plus detail
 * treatments (headings, tables, quotes, rules) in globals.css under `.theme-<id>`. Choosing a
 * theme applies its accent and typeface; both can be changed afterwards. Ids are stored in
 * projects, so they never change (labels can).
 */
export interface Theme { id: ThemeId; label: string; note: string; background: string; color: string; accent: string; font: FontFamily; dark: boolean }
export const themes: Theme[] = [
  { id: "mono", label: "Clean", note: "Crisp white, product clarity", background: "#ffffff", color: "#121417", accent: "#2f55e4", font: "sans", dark: false },
  { id: "editorial", label: "Editorial", note: "Magazine serif headlines on warm paper", background: "#f6f1e6", color: "#1c1a15", accent: "#b7361f", font: "sans", dark: false },
  { id: "linen", label: "Book", note: "Classic book typography, ruled tables", background: "#f2ebdd", color: "#211d17", accent: "#8a2b1d", font: "serif", dark: false },
  { id: "harbor", label: "Harbor", note: "Calm navy for reports and business", background: "#edf2f8", color: "#0f1d33", accent: "#1d4ed8", font: "sans", dark: false },
  { id: "mist", label: "Sage", note: "Soft green, quiet and natural", background: "#e8eee6", color: "#18261d", accent: "#2c6a4c", font: "sans", dark: false },
  { id: "rose", label: "Blush", note: "Warm terracotta with serif type", background: "#f8ede7", color: "#2b1a16", accent: "#b1452f", font: "serif", dark: false },
  { id: "swiss", label: "Swiss", note: "Bold poster grotesk, red and black", background: "#ffffff", color: "#0b0b0b", accent: "#d6120b", font: "sans", dark: false },
  { id: "citrus", label: "Citrus", note: "Sunny and loud for social posts", background: "#fbe9a6", color: "#1c1910", accent: "#a83a0c", font: "sans", dark: false },
  { id: "midnight", label: "Midnight", note: "Deep navy for tech and product", background: "#0e1424", color: "#e8edf7", accent: "#8ab4ff", font: "sans", dark: true },
  { id: "ink", label: "Noir", note: "Warm black with gold, serif elegance", background: "#151411", color: "#eee7d5", accent: "#e0b45c", font: "serif", dark: true },
  { id: "terminal", label: "Terminal", note: "Monospace green on black for code", background: "#0b110d", color: "#cfe8d5", accent: "#4ade80", font: "mono", dark: true },
  { id: "plum", label: "Plum", note: "Rich violet for creative work", background: "#1b1530", color: "#eee8ff", accent: "#c4a3ff", font: "sans", dark: true },
];
export const themeFor = (id: ThemeId) => themes.find(theme => theme.id === id) ?? themes[1];
/** The design fields a theme sets when chosen: its look, accent and typeface. */
export const themeLook = (id: ThemeId) => { const theme = themeFor(id); return { theme: theme.id, accent: theme.accent, fontFamily: theme.font }; };
export const accents = ["#4e66ff", "#ff5f3d", "#17785b", "#8d4dff", "#efb500", "#1c1b17"];
export const defaultDesign: Design = {
  presetId: "long", theme: "editorial", accent: "#b7361f", fontScale: 100,
  fontFamily: "sans", padding: 44, showBrand: false, showHeader: false,
  renderScale: 2, watermarkText: "", watermarkOpacity: 16,
  watermarkPosition: "bottom-right", imageMaxHeight: 480, byline: "bottom",
  bylineAlign: "left", bylineDivider: false, smartTypography: true, frame: "none",
};

export const exampleMarkdown = `# Good ideas deserve a clear picture.

Turn notes, explanations, and **useful discoveries** into an image worth sharing.

> Start with your words. The canvas takes care of the rest.

## Make it yours

1. Paste Markdown or open a file.
2. Choose a size, a theme, and a typeface.
3. Export a crisp PNG — ready to post.

Your work stays in this browser. No account needed.`;

export function newId(prefix = "doc") {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}`;
}

export function newPage(markdown = "", design: Partial<Design> = {}): StudioPage {
  return { id: newId("page"), markdown, design };
}

export function newProject(markdown = "", name = "Untitled", design = defaultDesign): Project {
  const now = Date.now();
  return { version: 2, id: newId(), name, pages: [newPage(markdown)], design: { ...design }, mode: "single", createdAt: now, updatedAt: now, revision: 0 };
}

export function presetFor(design: Design): CanvasPreset {
  return canvasPresets.find((preset) => preset.id === design.presetId) ?? canvasPresets[0];
}

export function effectiveDesign(project: Project, page?: StudioPage): Design {
  return { ...project.design, ...(project.mode === "carousel" ? page?.design : {}) };
}

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export const slugify = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "markdownpic";

export function normalizeDesign(input: unknown): Design {
  const value = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const number = (key: keyof Design, min: number, max: number) => typeof value[key] === "number" && Number.isFinite(value[key]) ? clamp(value[key] as number, min, max) : defaultDesign[key];
  return {
    presetId: canvasPresets.some((p) => p.id === value.presetId) ? String(value.presetId) : defaultDesign.presetId,
    theme: themes.some((t) => t.id === value.theme) ? value.theme as ThemeId : defaultDesign.theme,
    accent: typeof value.accent === "string" && /^#[\da-f]{6}$/i.test(value.accent) ? value.accent : defaultDesign.accent,
    fontScale: number("fontScale", 76, 140) as number,
    padding: number("padding", 20, 80) as number,
    imageMaxHeight: number("imageMaxHeight", 100, 1200) as number,
    fontFamily: ["sans", "serif", "mono"].includes(String(value.fontFamily)) ? value.fontFamily as FontFamily : "sans",
    showBrand: typeof value.showBrand === "boolean" ? value.showBrand : defaultDesign.showBrand,
    showHeader: typeof value.showHeader === "boolean" ? value.showHeader : defaultDesign.showHeader,
    renderScale: value.renderScale === 1 || value.renderScale === 3 ? value.renderScale : 2,
    watermarkText: typeof value.watermarkText === "string" ? value.watermarkText.slice(0, 80) : "",
    watermarkOpacity: number("watermarkOpacity", 6, 36) as number,
    watermarkPosition: ["center", "top-right", "bottom-right"].includes(String(value.watermarkPosition)) ? value.watermarkPosition as WatermarkPosition : "bottom-right",
    byline: ["bottom", "top", "none"].includes(String(value.byline)) ? value.byline as BylinePosition : "bottom",
    bylineAlign: ["left", "center", "right"].includes(String(value.bylineAlign)) ? value.bylineAlign as BylineAlign : "left",
    bylineDivider: typeof value.bylineDivider === "boolean" ? value.bylineDivider : false,
    smartTypography: typeof value.smartTypography === "boolean" ? value.smartTypography : true,
    frame: ["none", "gradient", "solid"].includes(String(value.frame)) ? value.frame as FrameStyle : "none",
  };
}

export function validateProject(value: unknown): Project {
  if (!value || typeof value !== "object") throw new Error("This is not a MarkdownPic project.");
  const input = value as Partial<Project>;
  if (input.version !== 2) throw new Error("This project version is not supported. Keep the original file.");
  if (!Array.isArray(input.pages) || !input.pages.length || input.pages.length > MAX_PAGES) throw new Error(`A project must contain 1–${MAX_PAGES} pages.`);
  if (input.pages.some(p => !p || typeof p.markdown !== "string")) throw new Error("This project has an unreadable page.");
  if (input.pages.reduce((size, page) => size + page.markdown.length, 0) > MAX_TEXT_LENGTH) throw new Error("This project is too large. Keep each project under 120,000 characters.");
  const base = newProject();
  const design = normalizeDesign(input.design);
  return {
    ...base, id: typeof input.id === "string" ? input.id.slice(0, 100) : base.id,
    name: typeof input.name === "string" ? input.name.slice(0, 120) : "Imported project",
    pages: input.pages.map(p => {
      const normalized = normalizeDesign({ ...design, ...p.design });
      const overrides = Object.fromEntries(Object.keys(p.design ?? {}).filter(key => key in defaultDesign).map(key => [key, normalized[key as keyof Design]]));
      return { id: newId("page"), markdown: p.markdown, design: overrides };
    }),
    design, mode: input.mode === "carousel" ? "carousel" : "single",
    createdAt: typeof input.createdAt === "number" ? input.createdAt : base.createdAt,
    updatedAt: typeof input.updatedAt === "number" ? input.updatedAt : base.updatedAt,
    revision: typeof input.revision === "number" && Number.isFinite(input.revision) ? input.revision : 0,
  };
}

function luminance(hex: string) {
  const values = hex.slice(1).match(/../g)!.map(v => parseInt(v, 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
}
export function contrastRatio(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (values[1] + .05) / (values[0] + .05);
}
export function foregroundOn(background: string) {
  return contrastRatio(background, "#ffffff") >= contrastRatio(background, "#111827") ? "#ffffff" : "#111827";
}
// Accent text must read on the canvas, and table-header text must read on the accent.
const accentReadable = (accent: string, background: string) => contrastRatio(accent, background) >= 4.5 && contrastRatio(accent, foregroundOn(accent)) >= 4.5;
export function readableAccent(accent: string, background: string) {
  if (accentReadable(accent, background)) return accent;
  const target = luminance(background) > .35 ? 0 : 255;
  const channels = accent.slice(1).match(/../g)!.map(v => parseInt(v, 16));
  for (let step = 1; step <= 20; step++) {
    const next = "#" + channels.map(c => Math.round(c + (target - c) * step / 20).toString(16).padStart(2, "0")).join("");
    if (accentReadable(next, background)) return next;
  }
  return target ? "#ffffff" : "#000000";
}
