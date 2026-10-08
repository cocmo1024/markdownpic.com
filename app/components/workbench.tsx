"use client";

import { memo, useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { CaptureCard } from "./capture-card";
import { Modal } from "./modal";
import { useProject } from "./use-project";
import { defaultDesign, effectiveDesign, MAX_IMAGE_BYTES, MAX_IMAGE_PIXELS, MAX_PAGES, MAX_TEXT_LENGTH, newPage, newProject, normalizeDesign, presetFor, slugify, themeLook, themes, type Design, type ImageFormat, type Project, type StudioPage, type ThemeId } from "@/lib/studio-model";
import { displayMarkdown, documentTitle, localAssetIds, pagesFromMarkdown, serializePages, splitMarkdownPages } from "@/lib/markdown-document";
import { loadLocalImage, saveLocalImage } from "@/lib/local-image-store";
import { deleteProject, listProjects, loadProject } from "@/lib/project-store";
import { templateDesign, templates } from "@/lib/templates";
import { inspectCard, type CaptureIssue } from "@/lib/capture-checks";
import type { ExportResult } from "@/lib/capture-engine";
import { StylePanel } from "./style-panel";
import { AdSlot } from "./ad-slot";
import { BrandMark, Icon } from "./icons";
import { MarkdownEditor } from "./markdown-editor";
import { decodeShare, encodeShare } from "@/lib/share-link";
import { FindBar, OutlineMenu } from "./editor-tools";
import { useBrand } from "./use-brand";
import { AppearanceSwitch } from "./appearance-switch";
import { BatchPanel } from "./batch-panel";
import type { BrandKit } from "@/lib/brand-kit";
import { ResultPanel } from "./result-panel";

const FORMATTING = [
  ["bold", "Bold", "bold text", "**", "**", "Ctrl/⌘ B"], ["italic", "Italic", "italic text", "*", "*", "Ctrl/⌘ I"],
  ["heading", "Insert heading", "Heading", "\n## ", "\n", ""], ["list", "Insert list", "List item", "\n- ", "\n", ""],
  ["quote", "Insert quote", "A line worth remembering", "\n> ", "\n", ""], ["code", "Inline code", "code", "`", "`", "Ctrl/⌘ E"],
  ["link", "Insert link", "link text", "[", "](https://)", "Ctrl/⌘ K"],
] as const;
const FORMAT_NAMES = { png: "PNG", jpeg: "JPEG", webp: "WebP" } as const;
const PREFS_KEY = "markdownpic.ui.v1";
const STYLE_KEY = "markdownpic.style.v1";
/** New projects start in the style the person used last: it should feel like their tool. */
function freshProject() {
  try { const saved = localStorage.getItem(STYLE_KEY); if (saved) return newProject("", "Untitled", normalizeDesign(JSON.parse(saved))); } catch { /* defaults */ }
  return newProject();
}
// Fixed-size rail units: a responsive unit would resize the workbench around it.
const RAIL_SIZES = [{ media: "(min-width: 1600px)", width: 300, height: 600 }, { media: "(min-width: 1280px)", width: 160, height: 600 }];

type Panel = "styles" | "templates" | "projects" | "export" | "result" | "batch" | null;
type Task = { type: "export" | "layout" | "file"; message: string; cancellable?: boolean; progress?: number };
const errorText = (error: unknown) => error instanceof Error ? error.message : "Something went wrong. Your original work is unchanged.";

async function cleanInlineImages(source: string, signal?: AbortSignal) {
  let result = source;
  for (const match of source.matchAll(/data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=\r\n]+/gi)) {
    if (signal?.aborted) throw new DOMException("Import cancelled. Your original is unchanged.", "AbortError");
    if (match[0].length > MAX_IMAGE_BYTES * 1.4) throw new Error("An embedded image is too large. Use an image under 12 MB.");
    const blob = await (await fetch(match[0])).blob();
    const { imageDimensions } = await import("@/lib/capture-engine");
    const dimensions = await imageDimensions(blob, signal);
    if (dimensions.width * dimensions.height > MAX_IMAGE_PIXELS) throw new Error("An embedded image is over 32 megapixels. Resize it before importing.");
    const id = await saveLocalImage(blob, "Imported image");
    result = result.replace(match[0], "asset:" + id);
  }
  return result;
}

/** Scales a fixed-width card to fill its fluid container. */
function FitPreview({ width, children }: { width: number; children: ReactNode }) {
  const frame = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(.45);
  useLayoutEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setScale(element.clientWidth / width));
    observer.observe(element);
    return () => observer.disconnect();
  }, [width]);
  return <span ref={frame} className="template-sample" aria-hidden="true"><span style={{ transform: "scale(" + scale + ")" }}>{children}</span></span>;
}

/** Page strip miniature; memoized on content so typing on one page leaves the others untouched. */
const PageThumb = memo(function PageThumb({ number, markdown, design, assetUrls, brand, current, disabled, onSelect }: { number: number; markdown: string; design: Design; assetUrls: Record<string, string>; brand: BrandKit | null; current: boolean; disabled: boolean; onSelect: () => void }) {
  const deferred = useDeferredValue(markdown);
  return <button className="page-thumbnail" aria-label={"Page " + number + ": " + (documentTitle(markdown) || "Empty page")} aria-current={current ? "page" : undefined} disabled={disabled} onClick={onSelect}><div className="miniature" aria-hidden="true"><div style={{ transform: "scale(" + 54 / presetFor(design).width + ")", transformOrigin: "top left" }}><CaptureCard markdown={deferred.slice(0, 5000)} design={design} assetUrls={assetUrls} brand={brand} /></div></div><span>{number}</span></button>;
}, (a, b) => a.number === b.number && a.markdown === b.markdown && a.current === b.current && a.disabled === b.disabled && a.assetUrls === b.assetUrls && a.brand === b.brand && JSON.stringify(a.design) === JSON.stringify(b.design));

export default function Workbench() {
  const doc = useProject();
  const brand = useBrand();
  const { project, apply } = doc;
  const { undo, redo } = doc;
  const [activeIndex, setActiveIndex] = useState(0);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [panel, setPanel] = useState<Panel>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [notice, setNotice] = useState("");
  const [assetUrls, setAssetUrls] = useState<Record<string, string>>({});
  const [metrics, setMetrics] = useState<{ width: number; height: number; issue: CaptureIssue | null }>({ width: 600, height: 620, issue: null });
  const [stageSize, setStageSize] = useState({ width: 720, height: 660 });
  const [zoom, setZoom] = useState<"fit" | number>("fit");
  const [editorSize, setEditorSize] = useState(17);
  const [editorTheme, setEditorTheme] = useState<"dark" | "light" | "match">("dark");
  const [split, setSplit] = useState(50);
  const [format, setFormat] = useState<ImageFormat>("png");
  const [exportScope, setExportScope] = useState<"all" | "page">("all");
  const [result, setResult] = useState<ExportResult | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [dragging, setDragging] = useState(false);
  const [find, setFind] = useState<{ replace: boolean; key: number; query: string } | null>(null);
  // Opening find prefills a single-line selection, read here in the event rather than during render.
  const openFind = (replace: boolean) => {
    const area = editor.current, selected = area ? area.value.slice(area.selectionStart, area.selectionEnd) : "";
    setFind(previous => ({ replace, key: (previous?.key ?? 0) + 1, query: selected.includes("\n") ? "" : selected }));
  };
  const editor = useRef<HTMLTextAreaElement>(null);
  const projectsButton = useRef<HTMLButtonElement>(null);
  const exportButton = useRef<HTMLButtonElement>(null);
  const card = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const urlMap = useRef(new Map<string, string>());
  const attemptedImages = useRef(new Set<string>());
  const assetProjectId = useRef("");
  const migrated = useRef(new Set<string>());
  const taskLock = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const index = Math.min(activeIndex, project.pages.length - 1);
  const page = project.pages[index];
  const source = useMemo(() => serializePages(project.pages), [project.pages]);
  const previewSource = project.mode === "single" ? displayMarkdown(project.pages) : page.markdown;
  const deferredPreview = useDeferredValue(previewSource);
  const editorSource = project.mode === "single" ? source : page.markdown;
  const design = useMemo(() => ({ ...project.design, ...(project.mode === "carousel" ? page.design : {}) }), [project.design, project.mode, page.design]);
  const preset = presetFor(design);
  const oversize = source.length > MAX_TEXT_LENGTH;
  // stageSize is the stage's content box (padding excluded), so the card fits without scrollbars.
  const fitZoom = Math.min(1, Math.max(.15, (stageSize.width - 2) / metrics.width), preset.height ? Math.max(.15, (stageSize.height - 2) / metrics.height) : 1);
  const scale = zoom === "fit" ? fitZoom : zoom;
  const disabled = !doc.ready || Boolean(task);
  // A mobile editor hides the preview with display:none, so its measured box is 0.
  // Fixed output sizes come from the design; auto height is unknown until measured.
  const outputWidth = preset.width * design.renderScale;
  const outputHeight = preset.height ? preset.height * design.renderScale
    : metrics.width === preset.width && metrics.height > 0 ? metrics.height * design.renderScale : null;
  const canCancel = task && (task.cancellable ?? task.type !== "file");

  const run = useCallback(async (type: Task["type"], message: string, action: (signal: AbortSignal) => Promise<void>, cancellable = type !== "file") => {
    if (taskLock.current) return;
    taskLock.current = true;
    const abort = new AbortController();
    controller.current = abort;
    setTask({ type, message, cancellable }); setNotice("");
    try { await action(abort.signal); }
    catch (error) { setPanel(null); setDeleteTarget(null); setNotice(errorText(error)); }
    finally { taskLock.current = false; controller.current = null; setTask(null); }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const ids = localAssetIds(source);
    const urls = urlMap.current, attempted = attemptedImages.current;
    if (assetProjectId.current !== project.id) {
      for (const url of urls.values()) URL.revokeObjectURL(url);
      urls.clear(); attempted.clear(); assetProjectId.current = project.id;
    }
    void (async () => {
      for (const id of ids) {
        if (urlMap.current.has(id) || attemptedImages.current.has(id)) continue;
        attemptedImages.current.add(id);
        try {
          const blob = await loadLocalImage(id);
          if (blob && !cancelled) urlMap.current.set(id, URL.createObjectURL(blob));
        } catch (error) { if (!cancelled) setNotice(errorText(error)); }
      }
      if (!cancelled) setAssetUrls(previous => {
        const next = Object.fromEntries(urlMap.current);
        return Object.keys(next).length === Object.keys(previous).length && Object.entries(next).every(([id, url]) => previous[id] === url) ? previous : next;
      });
    })();
    return () => { cancelled = true; for (const id of ids) if (!urls.has(id)) attempted.delete(id); };
  }, [source, project.id]);

  useEffect(() => () => {
    controller.current?.abort();
    for (const url of urlMap.current.values()) URL.revokeObjectURL(url);
    urlMap.current.clear();
    // Reconnected effects (including Fast Refresh) must reload revoked local URLs.
    attemptedImages.current.clear();
  }, []);

  useEffect(() => {
    if (!doc.ready || !/data:image\/(?:png|jpeg|webp);base64,/i.test(source) || migrated.current.has(project.id)) return;
    migrated.current.add(project.id);
    const originalId = project.id;
    void run("file", "Restoring embedded images…", async signal => {
      const cleaned = await cleanInlineImages(source, signal);
      apply(current => current.id === originalId ? { ...current, pages: splitMarkdownPages(cleaned).map((part, i) => ({ ...(current.pages[i] ?? newPage()), markdown: part.markdown })) } : current);
      setNotice("Embedded images restored. The original legacy draft was preserved.");
    });
  }, [doc.ready, source, project.id, apply, run]);

  useEffect(() => {
    const article = card.current, viewport = stage.current;
    if (!article || !viewport) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const issue = inspectCard(article);
        const height = Math.ceil(parseFloat(getComputedStyle(article).height) || article.offsetHeight);
        setMetrics(previous => previous.width === article.offsetWidth && previous.height === height && previous.issue?.code === issue?.code && previous.issue?.message === issue?.message ? previous : { width: article.offsetWidth, height, issue });
        const box = getComputedStyle(viewport);
        const innerWidth = viewport.clientWidth - parseFloat(box.paddingLeft) - parseFloat(box.paddingRight), innerHeight = viewport.clientHeight - parseFloat(box.paddingTop) - parseFloat(box.paddingBottom);
        setStageSize(previous => previous.width === innerWidth && previous.height === innerHeight ? previous : { width: innerWidth, height: innerHeight });
      });
    };
    const resize = new ResizeObserver(measure);
    resize.observe(article); resize.observe(viewport);
    const mutation = new MutationObserver(measure);
    mutation.observe(article, { childList: true, subtree: true, attributes: true });
    article.addEventListener("load", measure, true);
    article.addEventListener("error", measure, true);
    measure();
    return () => { cancelAnimationFrame(frame); resize.disconnect(); mutation.disconnect(); article.removeEventListener("load", measure, true); article.removeEventListener("error", measure, true); };
  }, [deferredPreview, design.presetId, design.fontScale, design.padding, design.byline, assetUrls, mobileView, oversize, brand]);

  const changeSource = (value: string, typing = true) => {
    const parts = splitMarkdownPages(value);
    const newLength = source.length - editorSource.length + value.length;
    if (newLength > MAX_TEXT_LENGTH && newLength >= source.length) { setNotice("Keep a project under 120,000 characters. Open large content as separate projects."); return; }
    if (parts.length + (project.mode === "carousel" ? project.pages.length - 1 : 0) > MAX_PAGES) { setNotice("A project supports up to " + MAX_PAGES + " pages."); return; }
    apply(current => {
      const pages = parts.map((part, i) => ({ ...(current.pages[(current.mode === "carousel" ? index : 0) + i] ?? newPage()), markdown: part.markdown }));
      if (current.mode === "carousel") {
        for (let i = 1; i < pages.length; i++) pages[i] = newPage(pages[i].markdown);
        return { ...current, pages: [...current.pages.slice(0, index), ...pages, ...current.pages.slice(index + 1)] };
      }
      return { ...current, pages };
    }, typing);
  };

  const insertText = (text: string, prefix = "", suffix = "") => {
    const area = editor.current;
    const start = area?.selectionStart ?? editorSource.length;
    const end = area?.selectionEnd ?? start;
    const selected = editorSource.slice(start, end);
    const addition = prefix + ((prefix || suffix) ? selected || text : text) + suffix;
    changeSource(editorSource.slice(0, start) + addition + editorSource.slice(end), false);
    requestAnimationFrame(() => { area?.focus(); area?.setSelectionRange(start + prefix.length, start + addition.length - suffix.length); });
  };

  const openProject = async (next: Project, preserve = true, signal?: AbortSignal) => {
    if (preserve) await doc.flush();
    if (signal?.aborted) throw new DOMException("Import cancelled. Your original project is unchanged.", "AbortError");
    await doc.open(next, false);
    setActiveIndex(0); setPanel(null); setMobileView("edit"); setZoom("fit"); setNotice("");
  };

  const handleFiles = (files: File[]) => void run("file", "Opening your file…", async signal => {
    if (!files.length) return;
    if (files.every(file => file.type.startsWith("image/"))) {
      if (files.length > 12) throw new Error("Insert up to 12 images at a time.");
      const { imageDimensions } = await import("@/lib/capture-engine");
      const insertions: string[] = [];
      for (const file of files) {
        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("Use a PNG, JPEG, or WebP image. Convert HEIC or SVG before inserting.");
        if (file.size > MAX_IMAGE_BYTES) throw new Error(file.name + " is larger than 12 MB.");
        const dimensions = await imageDimensions(file, signal);
        if (dimensions.width * dimensions.height > MAX_IMAGE_PIXELS) throw new Error(file.name + " is too large. Use an image under 32 megapixels.");
        if (signal.aborted) throw new Error("Import cancelled.");
        const id = await saveLocalImage(file, file.name);
        urlMap.current.set(id, URL.createObjectURL(file));
        insertions.push("![" + file.name.replace(/[\[\]\r\n]/g, "").replace(/\.[^.]+$/, "") + "](asset:" + id + ")");
      }
      setAssetUrls(Object.fromEntries(urlMap.current));
      insertText("\n\n" + insertions.join("\n\n") + "\n\n");
      setNotice("Images inserted with short, readable references.");
      return;
    }
    if (files.length !== 1) throw new Error("Open one Markdown or project file at a time.");
    const file = files[0];
    if (/\.(mdpic|zip)$/i.test(file.name)) {
      const { importProjectBundle } = await import("@/lib/project-bundle");
      const { imageDimensions } = await import("@/lib/capture-engine");
      const restored = await importProjectBundle(file, async blob => {
        const dimensions = await imageDimensions(blob, signal);
        if (dimensions.width * dimensions.height > MAX_IMAGE_PIXELS) throw new Error("This project has an image over 32 megapixels. Resize it before importing.");
        if (signal.aborted) throw new Error("Import cancelled. Your original project is unchanged.");
      });
      if (signal.aborted) throw new Error("Import cancelled. Your original project is unchanged.");
      await openProject(restored, true, signal);
      setNotice("Project restored as a new copy. The original remains in My projects.");
    } else {
      if (!/\.(md|markdown|mdown|txt)$/i.test(file.name)) throw new Error("Choose a Markdown (.md), text (.txt), or MarkdownPic (.mdpic) file.");
      if (file.size > 2_000_000) throw new Error("This text file is too large. Split it into smaller files first.");
      const markdown = await cleanInlineImages(await file.text(), signal);
      if (signal.aborted) throw new Error("Import cancelled. Your original project is unchanged.");
      if (markdown.length > MAX_TEXT_LENGTH) throw new Error("This document exceeds 120,000 characters. Split it into smaller files first.");
      const pages = pagesFromMarkdown(markdown);
      if (pages.length > MAX_PAGES) throw new Error("This document has more than " + MAX_PAGES + " pages.");
      const next = newProject("", file.name.replace(/\.[^.]+$/, ""));
      next.pages = pages; next.mode = pages.length > 1 ? "carousel" : "single";
      if (pages.length > 1) next.design.presetId = "portrait";
      await openProject(next, true, signal);
      setNotice("Opened as a new project. Your previous project is saved.");
    }
  }, true);

  const backup = () => void run("file", "Preparing your portable project…", async () => {
    const { exportProjectBundle } = await import("@/lib/project-bundle");
    const { downloadBlob } = await import("@/lib/capture-engine");
    const output = await exportProjectBundle(structuredClone(project));
    downloadBlob(output.blob, output.name);
    setNotice("Backup downloaded with Markdown, page styles, and local images.");
  });

  /**
   * Splits pages that are too long into measured pages that fit the canvas. Manual page breaks are
   * kept: each existing page is split on its own. With `onlyCurrent`, only the current page is split.
   */
  const autoSplit = (onlyCurrent = false) => void run("layout", "Measuring your content…", async signal => {
    const { captureSurface } = await import("@/lib/capture-engine");
    const { paginateMarkdown } = await import("@/lib/pagination");
    const snapshot = structuredClone(project);
    const fixed = (presetId: string) => presetId === "long" ? (snapshot.design.presetId === "long" ? "portrait" : snapshot.design.presetId) : presetId;
    const layout = { ...snapshot.design, presetId: fixed(snapshot.design.presetId) };
    const targets = onlyCurrent ? [index] : snapshot.pages.map((_, i) => i);
    const surface = captureSurface();
    let attempts = 0;
    try {
      const split = new Map<number, StudioPage[]>();
      for (const at of targets) {
        const source = snapshot.pages[at];
        // A page's own size override is kept, except auto height, which cannot be paginated.
        const design = source.design.presetId ? { ...source.design, presetId: fixed(source.design.presetId) } : source.design;
        const measured = { ...layout, ...design };
        const parts = source.markdown.trim() ? await paginateMarkdown(source.markdown, async markdown => {
          setTask({ type: "layout", message: "Finding page breaks · " + (++attempts) + " checks" });
          const element = await surface.render({ markdown, design: measured, assetUrls: { ...assetUrls }, brand }, signal);
          const issue = inspectCard(element);
          return { fits: !issue, reason: issue?.code === "width" ? "width" : issue?.code === "height" ? "height" : "asset", message: issue?.message };
        }, signal) : [source.markdown];
        split.set(at, parts.map(markdown => newPage(markdown, design)));
      }
      const pages = snapshot.pages.flatMap((page, i) => split.get(i) ?? [page]);
      if (pages.length > MAX_PAGES) throw new Error("This would make " + pages.length + " pages; a project holds up to " + MAX_PAGES + ". Shorten the text or split it into separate projects.");
      const added = pages.length - snapshot.pages.length;
      apply(current => ({ ...current, mode: "carousel", design: layout, pages }));
      if (onlyCurrent) { setNotice(added ? "Split this page into " + (added + 1) + ". Undo restores it." : "This page already fits."); return; }
      setActiveIndex(0); setMobileView("preview");
      setNotice(added ? "Created " + pages.length + " measured pages. Your page breaks were kept. Undo restores the original layout." : "Every page already fits.");
    } finally { surface.dispose(); }
  });

  const openTemplate = useCallback((id: string) => {
    const template = templates.find(item => item.id === id);
    if (!template) return;
    void run("file", "Opening template…", async () => {
      const next = newProject("", template.name, templateDesign(defaultDesign, template));
      next.pages = pagesFromMarkdown(template.markdown); next.mode = next.pages.length > 1 ? "carousel" : "single";
      await openProject(next);
    });
  // openProject reads the latest project through doc; it is recreated every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, doc]);


  useEffect(() => {
    if (!doc.ready) return;
    const timer = setTimeout(() => { try { localStorage.setItem(STYLE_KEY, JSON.stringify(project.design)); } catch { /* storage unavailable */ } }, 600);
    return () => clearTimeout(timer);
  }, [doc.ready, project.design]);

  // A shared link (#s=…) opens as a new local project; the fragment is then removed from the address bar.
  useEffect(() => {
    if (!doc.ready || !location.hash.startsWith("#s=")) return;
    const fragment = location.hash;
    history.replaceState(null, "", location.pathname + location.search);
    setTimeout(() => void run("file", "Opening shared draft…", async () => {
      const shared = decodeShare(fragment);
      await openProject(shared);
      setNotice("Shared draft opened and saved in this browser. Edits stay on your device.");
    }));
  // openProject reads the latest project through doc; it is recreated every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.ready, run]);

  const copyShareLink = async () => {
    const { fragment, tooLong, localImages } = encodeShare(project);
    if (tooLong) { setNotice("This draft is too long for a link. Use Back up project to share a .mdpic file instead."); return; }
    const url = location.origin + "/" + fragment;
    try { await navigator.clipboard.writeText(url); }
    catch { setNotice("Clipboard access was blocked. Try again, or use Back up project to share a file."); return; }
    setNotice(localImages ? "Editable link copied. Local images are not included; share a .mdpic backup to include them." : "Editable link copied. Anyone with the link gets their own copy to edit.");
  };

  // Largest image text size (76–140%) at which the current card fits its fixed canvas.
  const fitText = () => void run("layout", "Fitting text to the canvas…", async signal => {
    const { captureSurface } = await import("@/lib/capture-engine");
    const snapshot = structuredClone(project);
    const current = snapshot.pages[index];
    const base = effectiveDesign(snapshot, current);
    if (!presetFor(base).height) throw new Error("Auto height already fits everything. Choose Card or Pages to fit text to a fixed size.");
    const markdown = snapshot.mode === "single" ? displayMarkdown(snapshot.pages) : current.markdown;
    const surface = captureSurface();
    let low = 76, high = 140, best = 0;
    try {
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const element = await surface.render({ markdown, design: { ...base, fontScale: mid }, assetUrls: { ...assetUrls }, brand }, signal);
        const issue = inspectCard(element);
        if (issue && issue.code !== "height" && issue.code !== "width") throw new Error(issue.message);
        if (issue) high = mid - 1; else { best = mid; low = mid + 1; }
      }
    } finally { surface.dispose(); }
    if (!best) throw new Error("This is too much text for one canvas, even at the smallest size. Use Auto split or Long image.");
    apply(project => project.mode === "carousel"
      ? { ...project, pages: project.pages.map((item, i) => i === index ? { ...item, design: { ...item.design, fontScale: best } } : item) }
      : { ...project, design: { ...project.design, fontScale: best } });
    setNotice("Text sized to " + best + "% to fill the canvas. Undo restores the previous size.");
  });

  // Installable and offline: register the worker on the live site and hand it the assets already loaded.
  useEffect(() => {
    if (!("serviceWorker" in navigator) || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
    navigator.serviceWorker.register("/sw.js").then(() => navigator.serviceWorker.ready).then(registration => {
      const loaded = performance.getEntriesByType("resource").map(entry => entry.name).filter(name => name.startsWith(location.origin + "/_next/static/"));
      registration.active?.postMessage({ cache: loaded });
    }).catch(() => { /* offline support is a bonus, never a requirement */ });
  }, []);

  // Opening a .md file with the installed app (File Handling API) loads it here.
  useEffect(() => {
    const queue = (window as unknown as { launchQueue?: { setConsumer: (consumer: (params: { files: Array<{ getFile(): Promise<File> }> }) => void) => void } }).launchQueue;
    if (!doc.ready || !queue) return;
    queue.setConsumer(params => { if (params.files.length) void Promise.all(params.files.map(handle => handle.getFile())).then(files => handleFiles(files.slice(0, 1))); });
  // handleFiles reads the latest project; the consumer is registered once the draft is ready.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.ready]);

  // Guide pages link to /?template=<id>; the template opens as a new project, then the URL is cleaned.
  useEffect(() => {
    if (!doc.ready) return;
    const id = new URLSearchParams(location.search).get("template");
    if (!id) return;
    history.replaceState(null, "", location.pathname);
    // Deferred out of the effect; not cancelled on re-render, because the URL is already cleaned.
    setTimeout(() => openTemplate(id));
  }, [doc.ready, openTemplate]);

  // The Help menu is a <details>: close it on an outside press or Escape.
  useEffect(() => {
    const close = (event: Event) => {
      for (const menu of document.querySelectorAll<HTMLDetailsElement>("details.help-menu[open]")) {
        if (event instanceof KeyboardEvent ? event.key === "Escape" : !menu.contains(event.target as Node)) menu.open = false;
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", close); };
  }, []);

  // Batch: the current page (or the whole single image) is the template; each row becomes one image.
  const batchTemplate = project.mode === "single" ? displayMarkdown(project.pages) : page.markdown;
  const exportBatch = (markdowns: string[], names: string[]) => void run("export", "Preparing your batch…", async signal => {
    const { exportProject } = await import("@/lib/capture-engine");
    const snapshot: Project = { ...structuredClone(project), mode: "carousel", design: { ...design }, pages: markdowns.map(markdown => newPage(markdown)) };
    const output = await exportProject(snapshot, { ...assetUrls }, { format, brand, signal, batch: { maxPages: 100, names, pixelBudget: 600_000_000 }, onProgress: (message, progress) => setTask({ type: "export", message, progress }) });
    // Exporting renders and opens the result; downloading is the person’s next choice there.
    setResult(output); setPanel("result");
  });
  const openBatchAsPages = (markdowns: string[]) => void run("file", "Creating pages…", async () => {
    const next = newProject("", (documentTitle(batchTemplate) || "Batch") + " · batch", { ...design });
    next.pages = markdowns.map(markdown => newPage(markdown)); next.mode = "carousel";
    await openProject(next);
    setNotice("Opened " + markdowns.length + " rows as pages in a new project. Your template is saved.");
  });

  const startExport = useCallback(() => void run("export", "Preparing your image…", async signal => {
    const { exportProject } = await import("@/lib/capture-engine");
    const output = await exportProject(structuredClone(project), { ...assetUrls }, { format, brand, pageIds: exportScope === "page" && project.mode === "carousel" ? [project.pages[index].id] : undefined, signal, onProgress: (message, progress) => setTask({ type: "export", message, progress }) });
    // Exporting renders and opens the result; downloading is the person’s next choice there.
    setResult(output); setPanel("result");
  }), [run, project, format, assetUrls, exportScope, index, brand]);

  // The clipboard write starts inside the click, with the PNG supplied as a promise, so
  // browsers that require a user gesture (Safari) still accept it after rendering.
  const copyImage = () => {
    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") { setNotice("Image copy is not supported in this browser. Use Export instead."); return; }
    if (taskLock.current) return;
    let resolveImage!: (blob: Blob) => void, rejectImage!: (error: unknown) => void;
    const image = new Promise<Blob>((resolve, reject) => { resolveImage = resolve; rejectImage = reject; });
    // The clipboard may give up on the image before rendering fails; the failure is reported by run().
    image.catch(() => {});
    const writing = navigator.clipboard.write([new ClipboardItem({ "image/png": image })]);
    writing.catch(() => {});
    void run("export", "Copying image…", async signal => {
      try {
        const { exportProject } = await import("@/lib/capture-engine");
        const output = await exportProject(structuredClone(project), { ...assetUrls }, { format: "png", brand, pageIds: project.mode === "carousel" ? [project.pages[index].id] : undefined, signal, onProgress: (message, progress) => setTask({ type: "export", message, progress }) });
        resolveImage(output.images[0].blob);
      } catch (error) { rejectImage(error); throw error; }
      try { await writing; } catch { throw new Error("The browser blocked clipboard access. Use Export instead."); }
      setNotice(project.mode === "carousel" ? "Page " + (index + 1) + " copied as PNG. Paste it anywhere." : "Image copied as PNG. Paste it anywhere.");
    });
  };

  // Long single images follow the editor: scrolling the source scrolls the preview proportionally.
  const syncPreviewScroll = useCallback((ratio: number) => {
    const viewport = stage.current;
    if (!viewport || viewport.scrollHeight <= viewport.clientHeight + 4) return;
    viewport.scrollTop = ratio * (viewport.scrollHeight - viewport.clientHeight);
  }, []);

  // Interface preferences are per device and never part of a project.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
      // Restored once after hydration so server and client markup match.
      /* eslint-disable react-hooks/set-state-in-effect */
      if ([14, 15, 16, 17, 18, 20, 22].includes(saved.editorSize)) setEditorSize(saved.editorSize);
      if (typeof saved.split === "number") setSplit(Math.max(30, Math.min(70, saved.split)));
      if (["png", "jpeg", "webp"].includes(saved.format)) setFormat(saved.format);
      if (["dark", "light", "match"].includes(saved.editorTheme)) setEditorTheme(saved.editorTheme);
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch { /* storage unavailable: defaults apply */ }
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => { try { localStorage.setItem(PREFS_KEY, JSON.stringify({ editorSize, split, format, editorTheme })); } catch { /* ignore */ } }, 400);
    return () => clearTimeout(timer);
  }, [editorSize, split, format, editorTheme]);

  // Confirmations fade on their own; problems stay until dismissed.
  useEffect(() => {
    if (!notice || /fail|could not|cannot|can.t|error|blocked|too (large|long|much|wide|tall)|not (supported|valid)|invalid|damaged|incomplete|missing|exceed|limit|unavailable|use auto split|choose /i.test(notice)) return;
    const timer = setTimeout(() => setNotice(current => current === notice ? "" : current), 5200);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const shortcuts = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || panel) return;
      const key = event.key.toLowerCase();
      // Text fields outside the editor (project name, find) keep their own undo history.
      const target = event.target instanceof HTMLElement ? event.target : null;
      if ((key === "z" || key === "y") && target?.matches("input, textarea, [contenteditable]") && !target.closest(".md-editor")) return;
      if (event.key === "Enter") { event.preventDefault(); if (!disabled) startExport(); }
      if (key === "z") { event.preventDefault(); if (!disabled) { if (event.shiftKey) redo(); else undo(); } }
      if (key === "y") { event.preventDefault(); if (!disabled) redo(); }
      if (key === "s") { event.preventDefault(); void doc.flush().then(() => setNotice("Saved in this browser.")).catch(() => {}); }
      if (key === "o") { event.preventDefault(); if (!disabled) fileInput.current?.click(); }
    };
    window.addEventListener("keydown", shortcuts);
    return () => window.removeEventListener("keydown", shortcuts);
  }, [panel, disabled, startExport, undo, redo, doc]);

  const showProjects = () => void run("file", "Loading projects…", async () => {
    if (doc.saveState !== "conflict") await doc.flush();
    setProjects(await listProjects()); setPanel("projects");
  });
  const addPage = () => {
    if (project.pages.length >= MAX_PAGES) { setNotice("You can have up to " + MAX_PAGES + " pages."); return; }
    apply(current => ({ ...current, mode: "carousel", design: { ...current.design, presetId: current.design.presetId === "long" ? "portrait" : current.design.presetId }, pages: [...current.pages.slice(0, index + 1), newPage(), ...current.pages.slice(index + 1)] }));
    setActiveIndex(index + 1); setMobileView("edit");
    requestAnimationFrame(() => editor.current?.focus());
  };
  const movePage = (direction: number) => {
    const destination = index + direction;
    if (destination < 0 || destination >= project.pages.length) return;
    apply(current => { const pages = [...current.pages]; [pages[index], pages[destination]] = [pages[destination], pages[index]]; return { ...current, pages }; });
    setActiveIndex(destination);
  };
  const saveMarkdown = async () => {
    const { downloadBlob } = await import("@/lib/capture-engine");
    downloadBlob(new Blob([source], { type: "text/markdown;charset=utf-8" }), slugify(project.name) + ".md");
    setNotice(localAssetIds(source).length ? "Markdown saved. Use Back up project to include local images." : "Markdown saved.");
  };

  const statusMessage = task?.message ?? (oversize ? "Shorten this draft to preview and export." : metrics.issue?.code === "loading" ? "" : metrics.issue?.message ?? "");
  const exportLabel = task?.type === "export" ? (task.progress !== undefined ? "Exporting " + Math.round(task.progress * 100) + "%" : "Exporting…") : project.mode === "carousel" && exportScope === "all" && project.pages.length > 1 ? "Export " + project.pages.length + " images" : "Export " + FORMAT_NAMES[format];
  // Long image = one auto-height image; Card = one fixed canvas; Pages = several fixed canvases.
  // Leaving a mode never discards content: pages are joined or kept, and Undo restores the previous layout.
  const setOutput = (output: "long" | "card" | "pages") => apply(current => {
    const lastFixed = current.design.presetId === "long" ? (current.mode === "carousel" ? "portrait" : "square") : current.design.presetId;
    const withoutPagePresets = current.pages.map(item => { const design = { ...item.design }; delete design.presetId; return { ...item, design }; });
    if (output === "long") return { ...current, mode: "single", design: { ...current.design, presetId: "long" }, pages: withoutPagePresets };
    if (output === "card") return { ...current, mode: "single", design: { ...current.design, presetId: lastFixed }, pages: withoutPagePresets };
    return { ...current, mode: "carousel", design: { ...current.design, presetId: lastFixed } };
  });
  // A theme brings its own accent and typeface; both stay adjustable in Customize.
  const setTheme = (theme: ThemeId) => apply(current => current.mode === "carousel" && "theme" in (current.pages[index]?.design ?? {})
    ? { ...current, pages: current.pages.map((item, i) => i === index ? { ...item, design: { ...item.design, ...themeLook(theme) } } : item) }
    : { ...current, design: { ...current.design, ...themeLook(theme) } });

  return <main className={"studio mobile-" + mobileView} aria-label="Markdown to image studio">
    <h1 className="sr-only">MarkdownPic — Markdown to image</h1>
    <header className="app-header">
      <Link className="wordmark" href="/" aria-label="MarkdownPic home"><BrandMark size={28} /><span className="wordmark-text">Markdown<em>Pic</em></span></Link>
      <span className="header-divider" aria-hidden="true" />
      <input className="project-name" aria-label="Project name" value={project.name} maxLength={120} disabled={disabled} onChange={event => apply(current => ({ ...current, name: event.target.value }))} />
      <span className={"save-pill " + doc.saveState} title={doc.saveState === "saved" ? "Saved in this browser" : undefined}><i aria-hidden="true" />{doc.saveState === "saved" ? "Saved" : doc.saveState === "saving" ? "Saving…" : doc.saveState === "loading" ? "Restoring…" : "Not saved"}</span>
      <div className="mobile-tabs" role="tablist" aria-label="Workspace view" onKeyDown={event => {
        if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
          event.preventDefault();
          const next = event.key === "Home" ? "edit" : event.key === "End" ? "preview" : mobileView === "edit" ? "preview" : "edit";
          setMobileView(next); event.currentTarget.querySelectorAll<HTMLButtonElement>("[role=tab]")[next === "edit" ? 0 : 1]?.focus();
        }
      }}><button role="tab" tabIndex={mobileView === "edit" ? 0 : -1} aria-selected={mobileView === "edit"} aria-controls="editor-pane" onClick={() => setMobileView("edit")}>Edit</button><button role="tab" tabIndex={mobileView === "preview" ? 0 : -1} aria-selected={mobileView === "preview"} aria-controls="preview-pane" onClick={() => setMobileView("preview")}>Preview</button></div>
      <nav className="header-actions" aria-label="Projects and help"><button className="ghost-button" title="New project" disabled={disabled} onClick={() => void run("file", "Creating a project…", () => openProject(freshProject()))}><Icon name="plus" /><span>New</span></button><button className="ghost-button" title="My projects" ref={projectsButton} disabled={disabled} onClick={showProjects}><Icon name="folder" /><span>My projects</span></button><details className="help-menu"><summary className="ghost-button" title="Help and guides"><Icon name="help" /><span>Help</span></summary><div className="help-popover" role="menu"><Link role="menuitem" href="/help">Help</Link><Link role="menuitem" href="/guides">Guides</Link><Link role="menuitem" href="/privacy">Privacy</Link><Link role="menuitem" href="/terms">Terms</Link><div className="popover-section"><span>Appearance</span><AppearanceSwitch /><span>Editor</span><div className="appearance-switch" role="group" aria-label="Editor colors">{(["dark", "light", "match"] as const).map(value => <button key={value} aria-pressed={editorTheme === value} onClick={() => setEditorTheme(value)}>{value === "dark" ? "Dark" : value === "light" ? "Light" : "Match"}</button>)}</div></div></div></details></nav>
      <div className="export-actions">
        {task ? <button disabled={!canCancel} onClick={() => controller.current?.abort()}>{canCancel ? "Cancel" : "Working…"}</button> : <button className="icon-only" title="Export options: format, resolution, pages" aria-label="Export options" disabled={!doc.ready} onClick={() => setPanel("export")}><Icon name="more" /></button>}
        <button className="icon-only" title="Copy image to clipboard" aria-label="Copy image" disabled={disabled || oversize} onClick={copyImage}><Icon name="copy" /></button>
        <button ref={exportButton} className="primary-button" disabled={disabled || oversize} title="Export (Ctrl/⌘ Enter)" onClick={startExport}>{exportLabel}<Icon name="arrow" /></button>
      </div>
    </header>
    {notice && <div className="notice" role="status"><span>{notice}</span><button aria-label="Dismiss message" onClick={() => setNotice("")}>×</button></div>}
    {doc.saveError && <div className="notice notice-error" role="alert"><span>{doc.saveError}</span><button onClick={() => void doc.saveCopy().catch(error => setNotice(errorText(error)))}>Save a copy</button><button onClick={backup}>Back up</button>{doc.saveState === "error" && <button onClick={() => void doc.flush().catch(() => {})}>Retry save</button>}</div>}
    <div className="studio-body">
      <div ref={grid} className="workbench" style={{ "--editor-share": split + "%" } as CSSProperties}>
        <section id="editor-pane" className="editor-pane" data-editor={editorTheme} aria-label="Markdown editor">
          <div className="pane-bar editor-toolbar" role="toolbar" aria-label="Formatting">
            {FORMATTING.map(([icon, label, text, prefix, suffix, keys]) => <button key={icon} className="tool-button" disabled={disabled} title={label + (keys ? " (" + keys + ")" : "")} aria-label={label} onClick={() => insertText(text, prefix, suffix)}><Icon name={icon} /></button>)}
            <button className="tool-button" disabled={disabled} title="Add image (or paste / drop one)" aria-label="Add image" onClick={() => imageInput.current?.click()}><Icon name="image" /></button>
            <span className="toolbar-divider" />
            <button className="tool-button" disabled={disabled || !doc.canUndo} aria-label="Undo" title="Undo (Ctrl/⌘ Z)" onClick={doc.undo}><Icon name="undo" /></button><button className="tool-button" disabled={disabled || !doc.canRedo} aria-label="Redo" title="Redo (Ctrl/⌘ Shift Z)" onClick={doc.redo}><Icon name="redo" /></button>
            <span className="toolbar-divider" />
            <button className="tool-button" disabled={disabled} title="Find and replace (Ctrl/⌘ F)" aria-label="Find and replace" aria-pressed={Boolean(find)} onClick={() => find ? setFind(null) : openFind(false)}><Icon name="search" /></button>
            <OutlineMenu value={editorSource} textareaRef={editor} disabled={disabled} />
            <span className="bar-spacer" />
            <button className="ghost-button" title="Open a Markdown or .mdpic file (Ctrl/⌘ O)" disabled={disabled} onClick={() => fileInput.current?.click()}><Icon name="file" /><span>Open file</span></button>
            <button className="ghost-button" title="Templates" disabled={disabled} onClick={() => setPanel("templates")}><Icon name="grid" /><span>Templates</span></button>
            <select className="size-select" aria-label="Editor text size" title="Editor text size" value={editorSize} onChange={event => setEditorSize(Number(event.target.value))}>{[14, 15, 16, 17, 18, 20, 22].map(size => <option key={size} value={size}>{size}px</option>)}</select>
            <select className="size-select theme-select" aria-label="Editor colors" title="Editor colors" value={editorTheme} onChange={event => setEditorTheme(event.target.value as typeof editorTheme)}><option value="dark">Dark</option><option value="light">Light</option><option value="match">Match</option></select>
          </div>
          <div className={"editor-body " + (dragging ? "is-dragging" : "")} onDragOver={event => { if (event.dataTransfer.types.includes("Files")) { event.preventDefault(); setDragging(true); } }} onDragLeave={() => setDragging(false)} onDrop={event => { if (event.dataTransfer.files.length) { event.preventDefault(); setDragging(false); handleFiles(Array.from(event.dataTransfer.files)); } }}>
            <MarkdownEditor textareaRef={editor} label={project.mode === "carousel" ? "Markdown for page " + (index + 1) : "Markdown source"} value={editorSource} disabled={disabled} fontSize={editorSize} placeholder={"# Start with your words\n\nPaste Markdown, drop a file or image, or open a template.\nPut <!-- page --> on its own line to start a new page."} onChange={value => changeSource(value)} onEdit={value => changeSource(value, false)} onScrollRatio={syncPreviewScroll} onFind={openFind} onNotice={setNotice} onPaste={event => { const files = Array.from(event.clipboardData.files); if (files.length) { event.preventDefault(); handleFiles(files); } }} />
            {find && <FindBar key={find.key} value={editorSource} textareaRef={editor} initialQuery={find.query} startWithReplace={find.replace} onReplace={value => changeSource(value, false)} onClose={() => { setFind(null); editor.current?.focus(); }} />}
            {dragging && <div className="drop-hint"><Icon name="download" size={28} /><span>Drop Markdown, a project, or images</span></div>}
            <span className="editor-meta" aria-live="off">{editorSource.length.toLocaleString()} chars{project.mode === "carousel" ? " · page " + (index + 1) : ""}</span>
          </div>
        </section>
        <div className="pane-resizer" role="separator" tabIndex={0} aria-label="Resize editor and preview" aria-orientation="vertical" aria-valuemin={30} aria-valuemax={70} aria-valuenow={Math.round(split)} onDoubleClick={() => setSplit(50)} onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); setSplit(value => Math.max(30, Math.min(70, value + (event.key === "ArrowRight" ? 2 : -2)))); } }} onPointerDown={event => event.currentTarget.setPointerCapture(event.pointerId)} onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId) && grid.current) { const rect = grid.current.getBoundingClientRect(); setSplit(Math.max(30, Math.min(70, (event.clientX - rect.left) / rect.width * 100))); } }} onPointerUp={event => event.currentTarget.releasePointerCapture(event.pointerId)} />
        <section id="preview-pane" className="preview-pane" aria-label="Image preview">
          <div className="pane-bar preview-toolbar">
            <div className="segmented" role="group" aria-label="Output mode"><button disabled={disabled} title="One image that grows with your content" aria-pressed={project.mode === "single" && project.design.presetId === "long"} onClick={() => setOutput("long")}>Long image</button><button disabled={disabled} title="One fixed-size image: square, portrait, story or landscape" aria-pressed={project.mode === "single" && project.design.presetId !== "long"} onClick={() => setOutput("card")}>Card</button><button disabled={disabled} title="Several fixed-size images, exported as a ZIP" aria-pressed={project.mode === "carousel"} onClick={() => setOutput("pages")}>Pages{project.pages.length > 1 ? " · " + project.pages.length : ""}</button></div>
            <button className="ghost-button" disabled={disabled || oversize} title="Split into pages that fit the canvas" onClick={() => autoSplit()}><Icon name="split" /><span>Auto split</span></button>
            <span className="bar-spacer" />
            <div className="quick-themes" role="group" aria-label="Theme">{themes.map(theme => <button key={theme.id} className="theme-dot" aria-label={"Theme: " + theme.label} title={theme.label + " · " + theme.note} aria-pressed={design.theme === theme.id} disabled={disabled} style={{ background: theme.background, color: theme.color }} onClick={() => setTheme(theme.id)} />)}</div>
            <button className="style-button" disabled={disabled} onClick={() => setPanel("styles")}><Icon name="sliders" /><span>Customize</span></button>
          </div>
          <div className="preview-frame">
            {task?.progress !== undefined && <div className="export-progress" role="progressbar" aria-label="Export progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(task.progress * 100)}><i style={{ transform: "scaleX(" + Math.max(.04, task.progress) + ")" }} /></div>}
            <div className="preview-stage" ref={stage} aria-busy={previewSource !== deferredPreview}>
              {oversize ? <div className="empty-message">This draft exceeds 120,000 characters. Its source has been preserved. Remove some content or save the Markdown and split it into smaller projects.</div> :
                <div className="canvas-placement" style={{ width: metrics.width * scale, height: metrics.height * scale }}><div style={{ transform: "scale(" + scale + ")", transformOrigin: "top left" }}>
                  <CaptureCard markdown={deferredPreview} design={design} assetUrls={assetUrls} label={project.mode === "carousel" ? (index + 1) + " / " + project.pages.length : preset.label} articleRef={card} brand={brand} />
                </div></div>}
            </div>
            <div className={"stage-status" + (statusMessage ? "" : " is-quiet") + (metrics.issue && !task ? " has-issue" : "") + (task ? " is-busy" : "")} role="status"><i aria-hidden="true" /><span>{statusMessage || (project.mode === "carousel" ? "Current page fits" : "Ready to export")}</span>{metrics.issue?.code === "height" && !task && preset.height && <button onClick={fitText}>Fit text</button>}{metrics.issue?.code === "height" && !task && (project.mode === "carousel"
              // In a carousel every page keeps the canvas size; splitting is the fix, not a taller page.
              ? <button onClick={() => autoSplit(true)}>Split this page</button>
              : <button onClick={() => apply(current => ({ ...current, design: { ...current.design, presetId: "long" }, pages: current.pages.map((item, i) => i === index ? { ...item, design: { ...item.design, presetId: "long" } } : item) }))}>Use auto height</button>)}</div>
            <span className="stage-meta">{preset.label} · {outputWidth} × {outputHeight ?? "auto"}{project.mode === "carousel" && Object.keys(page.design).length ? " · page style" : ""}</span>
            <div className="zoom-control" role="group" aria-label="Preview zoom"><button aria-pressed={zoom === "fit"} onClick={() => setZoom("fit")}>Fit</button><button aria-pressed={zoom === 1} onClick={() => setZoom(1)}>100%</button><span>{Math.round(scale * 100)}%</span></div>
          </div>
          {project.mode === "carousel" && <div className="page-strip"><div className="page-thumbnails" aria-label="Pages">{project.pages.map((item, i) => <PageThumb key={item.id} number={i + 1} markdown={item.markdown} design={effectiveDesign(project, item)} assetUrls={assetUrls} brand={brand} current={i === index} disabled={disabled} onSelect={() => setActiveIndex(i)} />)}<button className="add-page" title="Add page" disabled={disabled || project.pages.length >= MAX_PAGES} onClick={addPage}><Icon name="plus" /><span>Add page</span></button></div><div className="page-actions"><button disabled={disabled || index === 0} aria-label="Move page earlier" title="Move earlier" onClick={() => movePage(-1)}><Icon name="left" /></button><button disabled={disabled || index === project.pages.length - 1} aria-label="Move page later" title="Move later" onClick={() => movePage(1)}><Icon name="right" /></button><button disabled={disabled || project.pages.length === 1} title="Remove page" onClick={() => { apply(current => ({ ...current, pages: current.pages.filter((_, i) => i !== index) })); setActiveIndex(Math.max(0, index - 1)); setNotice("Page removed. Undo can restore it."); }}><Icon name="trash" /><span>Remove page</span></button></div></div>}
        </section>
      </div>
      <AdSlot slot="rail" media="(min-width: 1280px)" sizes={RAIL_SIZES} className="ad-rail" fallback={<div className="rail-tips"><strong>Shortcuts</strong><p><kbd>Ctrl/⌘</kbd> <kbd>Enter</kbd> Export</p><p><kbd>Ctrl/⌘</kbd> <kbd>B</kbd> / <kbd>I</kbd> / <kbd>K</kbd> Bold, italic, link</p><p><kbd>Ctrl/⌘</kbd> <kbd>S</kbd> Save now</p><p><kbd>Tab</kbd> Indent a list</p></div>} />
    </div>
    <input ref={fileInput} type="file" aria-label="Open a Markdown or project file" className="sr-only" tabIndex={-1} accept=".md,.markdown,.mdown,.txt,.mdpic,.zip,image/png,image/jpeg,image/webp" onChange={event => { handleFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
    <input ref={imageInput} type="file" aria-label="Choose local images" className="sr-only" tabIndex={-1} multiple accept="image/png,image/jpeg,image/webp" onChange={event => { handleFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
    {panel === "styles" && <StylePanel project={project} index={index} apply={apply} onFit={fitText} onClose={() => setPanel(null)} onDone={() => { setPanel(null); setMobileView("preview"); }} />}
    {panel === "templates" && <Modal title="Start from a template" wide onClose={() => setPanel(null)}><p className="modal-intro">Each template opens as a new project. Your current work is saved.</p><div className="template-grid">{templates.map(template => { const sampleDesign = templateDesign(defaultDesign, template); const width = presetFor(sampleDesign).width; return <button className="template-option" disabled={disabled} key={template.id} onClick={() => openTemplate(template.id)}><FitPreview width={width}><CaptureCard markdown={splitMarkdownPages(template.markdown)[0].markdown} design={sampleDesign} assetUrls={{}} brand={brand} /></FitPreview><strong>{template.name}</strong><span>{template.description}</span></button>; })}</div></Modal>}
    {panel === "projects" && <Modal title="My projects" onClose={() => setPanel(null)} returnFocusRef={projectsButton}><p className="modal-intro">Saved only in this browser. Back up important work before clearing browser data or switching devices.</p><div className="project-list">{projects.map(item => <div className="project-row" key={item.id}><button disabled={disabled} onClick={() => void run("file", "Opening project…", async () => { const latest = await loadProject(item.id); if (!latest) throw new Error("This project was removed in another tab."); await openProject(latest, doc.saveState !== "conflict"); })}><strong>{item.name || "Untitled"}{item.id === project.id ? " · Current" : ""}</strong><span>{item.pages.length} {item.pages.length === 1 ? "page" : "pages"} · {new Date(item.updatedAt).toLocaleDateString("en")}</span></button><button className="icon-button" aria-label={"Delete " + (item.name || "Untitled")} onClick={() => setDeleteTarget(item)}>×</button></div>)}</div><div className="modal-footer wrap"><button disabled={disabled} onClick={backup}>Back up current project</button><button disabled={disabled} onClick={() => fileInput.current?.click()}>Restore .mdpic</button><button disabled={disabled} onClick={() => void saveMarkdown().catch(error => setNotice(errorText(error)))}>Save Markdown</button></div></Modal>}
    {deleteTarget && <Modal title="Delete this local project?" onClose={() => setDeleteTarget(null)}><p className="modal-intro">“{deleteTarget.name || "Untitled"}” will be removed from this browser. Download a backup first if you might need it again.</p><div className="modal-footer"><button onClick={() => setDeleteTarget(null)}>Keep project</button><button className="danger-button" disabled={disabled} onClick={() => void run("file", "Removing project…", async () => { if (deleteTarget.id === project.id) await openProject(freshProject()); await deleteProject(deleteTarget.id); setProjects(await listProjects()); setDeleteTarget(null); setPanel("projects"); })}>Delete project</button></div></Modal>}
    {panel === "export" && <Modal title="Export options" onClose={() => setPanel(null)}><div className="settings-content">
      <label>File name<input maxLength={120} value={project.name} onChange={event => apply(current => ({ ...current, name: event.target.value }))} /></label>
      <fieldset><legend>Format</legend><div className="choice-row">{(["png", "jpeg", "webp"] as const).map(item => <button key={item} aria-pressed={format === item} onClick={() => setFormat(item)}><strong>{FORMAT_NAMES[item]}</strong><small>{item === "png" ? "Sharp text · copyable" : item === "jpeg" ? "Smaller photos" : "Compact, modern"}</small></button>)}</div></fieldset>
      <fieldset><legend>Resolution</legend><div className="choice-row">{([1, 2, 3] as const).map(renderScale => <button key={renderScale} aria-pressed={project.design.renderScale === renderScale} onClick={() => apply(current => ({ ...current, design: { ...current.design, renderScale }, pages: current.pages.map(item => { const overrides = { ...item.design }; delete overrides.renderScale; return { ...item, design: overrides }; }) }))}><strong>{renderScale}×</strong><small>{preset.width * renderScale} px wide{renderScale === 2 ? " · best" : ""}</small></button>)}</div><small className="size-readout">{outputHeight === null ? "Auto height is measured when you export." : <>{outputWidth.toLocaleString()} × {outputHeight.toLocaleString()} px · {(outputWidth * outputHeight / 1e6).toFixed(1)} MP{outputWidth * outputHeight > 24e6 || Math.max(outputWidth, outputHeight) > 16384 ? <span className="size-warning"> · Large image: needs a desktop browser. Choose 2× or Pages if export fails.</span> : null}</>}</small></fieldset>
      {project.mode === "carousel" && <label>Pages<select value={exportScope} onChange={event => setExportScope(event.target.value as typeof exportScope)}><option value="all">All {project.pages.length} pages · ZIP when multiple</option><option value="page">Current page only · page {index + 1}</option></select></label>}
      <p className="field-note">Every page is checked before download. If content does not fit, the export stops and tells you which page needs attention.</p>
      <div className="option-section"><span className="option-label">Batch</span><div className="share-row"><button onClick={() => setPanel("batch")}><Icon name="grid" />Create a batch from a table</button><small>One image per row of a spreadsheet or CSV, using this page as the template.</small></div></div>
      <div className="option-section"><span className="option-label">Share</span><div className="share-row"><button onClick={() => void copyShareLink()}><Icon name="link" />Copy editable link</button><small>The draft travels inside the link itself and is never uploaded. Local images are not included.</small></div></div>
    </div><div className="modal-footer"><button onClick={() => setPanel(null)}>Back</button><button className="primary-button" disabled={disabled} onClick={() => { setPanel(null); startExport(); }}>{exportLabel}<Icon name="arrow" /></button></div></Modal>}
    {panel === "batch" && <BatchPanel template={batchTemplate} design={design} brand={brand} assetUrls={assetUrls} disabled={disabled} onExport={exportBatch} onOpenAsPages={openBatchAsPages} onClose={() => setPanel(null)} />}
    {panel === "result" && result && <ResultPanel result={result} onClose={() => setPanel(null)} returnFocusRef={exportButton} onCopyLink={() => void copyShareLink()} onSetUpBrand={brand ? undefined : () => setPanel("styles")} />}
  </main>;
}
