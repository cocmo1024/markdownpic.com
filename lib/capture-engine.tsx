"use client";

import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { toBlob } from "html-to-image";
import { CaptureCard, type CaptureProps } from "@/app/components/capture-card";
import { displayMarkdown, localAssetIds, serializePages } from "./markdown-document";
import { effectiveDesign, MAX_PAGES, presetFor, slugify, type Project, type ImageFormat } from "./studio-model";
import type { BrandKit } from "./brand-kit";
import { assertExportSize, EXTENDED_LIMITS, inspectCard, STANDARD_LIMITS } from "./capture-checks";
import { withDeadline } from "./async-deadline";

export interface ExportedImage { blob: Blob; name: string; width: number; height: number; page: number }
export interface ExportResult { images: ExportedImage[]; download: Blob; name: string; markdown: string }

function checkAbort(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Export cancelled. Your work is unchanged.", "AbortError");
}

const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

async function ready(card: HTMLElement, signal?: AbortSignal) {
  const deadline = Date.now() + 20_000;
  await withDeadline(document.fonts.ready, { signal, timeoutMs: 20_000, message: "Fonts are taking too long to load. Try exporting again." });
  while (true) {
    checkAbort(signal);
    const pending = card.querySelector("[data-capture-pending]") || [...card.querySelectorAll("img")].some(image => !image.complete);
    if (!pending) break;
    if (Date.now() > deadline) throw new Error("An image or diagram did not finish loading. Replace remote images with local files and try again.");
    await new Promise(resolve => setTimeout(resolve, 60));
  }
  await withDeadline(Promise.all([...card.querySelectorAll("img")].map(image => image.decode().catch(() => {}))), { signal, timeoutMs: 10_000, message: "An image could not be decoded. Replace it or try a smaller image." });
  await withDeadline(frame().then(frame), { signal, timeoutMs: 10_000, message: "The browser paused rendering. Keep this tab visible and export again." });
  checkAbort(signal);
}

/** A separate, frozen render surface. UI controls, ads and preview transforms cannot enter it. */
export function captureSurface() {
  const host = document.createElement("div");
  host.className = "capture-surface";
  host.setAttribute("aria-hidden", "true");
  host.inert = true;
  document.body.appendChild(host);
  const root = createRoot(host);
  let card: HTMLElement | null = null;
  let revision = 0;
  return {
    async render(props: CaptureProps, signal?: AbortSignal) {
      checkAbort(signal);
      flushSync(() => root.render(<CaptureCard {...props} key={++revision} articleRef={node => { card = node; }} />));
      const target = card as HTMLElement | null;
      if (!target) throw new Error("The export canvas could not be prepared. Try again.");
      await ready(target, signal);
      return target;
    },
    dispose() { root.unmount(); host.remove(); },
  };
}

/** Whether this browser can allocate and draw a canvas this large (limits differ by browser and device). */
function canvasFits(width: number, height: number) {
  if (width <= STANDARD_LIMITS.edge && height <= STANDARD_LIMITS.edge && width * height <= STANDARD_LIMITS.pixels) return true;
  const canvas = document.createElement("canvas");
  try {
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return false;
    context.fillRect(width - 1, height - 1, 1, 1);
    return context.getImageData(width - 1, height - 1, 1, 1).data[3] !== 0;
  } catch { return false; } finally { canvas.width = 0; canvas.height = 0; }
}

export async function imageDimensions(blob: Blob, signal?: AbortSignal) {
  const url = URL.createObjectURL(blob);
  const image = new Image();
  try {
    const decoding = new Promise<{ width: number; height: number }>((resolve, reject) => {
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error("This image format could not be read. Try PNG, JPEG, or WebP."));
      image.src = url;
    });
    return await withDeadline(decoding, { signal, timeoutMs: 10_000, message: "The image could not be decoded. Try a smaller image." });
  } finally { image.onload = null; image.onerror = null; image.removeAttribute("src"); URL.revokeObjectURL(url); }
}

async function encodeImage(png: Blob, format: ImageFormat, width: number, height: number, signal?: AbortSignal) {
  if (format === "png") return png;
  if (format === "webp" && Math.max(width, height) > 16383) throw new Error("WebP images are limited to 16,383 pixels per side. Choose PNG or JPEG for this long image.");
  const url = URL.createObjectURL(png);
  const canvas = document.createElement("canvas");
  try {
    const image = new Image();
    image.src = url;
    await withDeadline(image.decode(), { signal, timeoutMs: 10_000, message: "The browser could not decode this export. Try PNG or a lower resolution." });
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare this image. Try PNG.");
    context.drawImage(image, 0, 0);
    const blob = await withDeadline(new Promise<Blob | null>(resolve => canvas.toBlob(resolve, `image/${format}`, .94)), { signal, timeoutMs: 30_000, message: "Image encoding took too long. Try PNG or a lower resolution." });
    canvas.width = 0; canvas.height = 0;
    if (!blob || blob.type !== `image/${format}`) throw new Error("This browser does not support that export format. Choose PNG instead.");
    return blob;
  } finally { canvas.width = 0; canvas.height = 0; URL.revokeObjectURL(url); }
}

export async function exportProject(project: Project, assetUrls: Record<string, string>, options: {
  format: ImageFormat; pageIds?: string[]; signal?: AbortSignal; brand?: BrandKit | null; onProgress: (message: string, progress: number) => void;
}): Promise<ExportResult> {
  // Own the exact content and design version at the start of the task.
  const snapshot = structuredClone(project);
  const assets = { ...assetUrls };
  const pages = snapshot.mode === "single" ? [{ id: "single", markdown: displayMarkdown(snapshot.pages), design: {} }] : snapshot.pages.filter(p => !options.pageIds || options.pageIds.includes(p.id));
  if (!pages.length || pages.length > MAX_PAGES) throw new Error(`Choose between 1 and ${MAX_PAGES} pages.`);
  const surface = captureSurface();
  const images: ExportedImage[] = [];
  let totalPixels = 0;
  try {
    for (const [index, page] of pages.entries()) {
      checkAbort(options.signal);
      const pageNumber = snapshot.mode === "single" ? 1 : snapshot.pages.findIndex(p => p.id === page.id) + 1;
      options.onProgress(`Rendering ${index + 1} of ${pages.length}…`, index / pages.length);
      try {
        if (localAssetIds(page.markdown).some(id => !assets[id])) throw new Error("A local image is missing. Restore the project backup or replace the image.");
        const design = effectiveDesign(snapshot, page);
        const preset = presetFor(design);
        const label = snapshot.mode === "single" ? preset.label : `${pageNumber} / ${snapshot.pages.length}`;
        const card = await surface.render({ markdown: page.markdown, design, assetUrls: assets, label, brand: options.brand }, options.signal);
        const issue = inspectCard(card);
        if (issue) throw new Error(issue.message);
        const logicalHeight = preset.height ?? Math.ceil(card.getBoundingClientRect().height);
        const width = preset.width * design.renderScale;
        const height = logicalHeight * design.renderScale;
        assertExportSize(width, height, totalPixels, canvasFits(width, height) ? EXTENDED_LIMITS : STANDARD_LIMITS);
        // Long images render for longer; the deadline grows with the pixel count.
        const renderTimeout = Math.max(30_000, width * height / 1_000_000 * 1_500);
        // Query parameters can identify different images from the same endpoint.
        const png = await withDeadline(toBlob(card, { pixelRatio: design.renderScale, width: preset.width, height: logicalHeight, includeQueryParams: true, skipAutoScale: true, fetchRequestInit: { signal: options.signal } }), { signal: options.signal, timeoutMs: renderTimeout, message: "This image took too long to render. Keep the tab visible, reduce the resolution, or split the content." });
        checkAbort(options.signal);
        if (!png) throw new Error("The image could not be rendered. Try a lower resolution.");
        const actual = await imageDimensions(png, options.signal);
        if (actual.width !== width || actual.height !== height) throw new Error("The exported dimensions did not match. No incomplete file was downloaded.");
        const blob = await encodeImage(png, options.format, width, height, options.signal);
        totalPixels += width * height;
        const extension = options.format === "jpeg" ? "jpg" : options.format;
        images.push({ blob, name: `${slugify(snapshot.name)}${snapshot.mode === "carousel" ? `-${String(pageNumber).padStart(2, "0")}` : ""}.${extension}`, width, height, page: pageNumber });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") throw error;
        throw new Error(`Page ${pageNumber}: ${error instanceof Error ? error.message : "Export failed. Please try again."}`);
      }
    }
  } finally { surface.dispose(); }
  checkAbort(options.signal);
  // The editable companion must retain page breaks, unlike the visual single-image text.
  const markdown = serializePages(snapshot.pages);
  if (images.length === 1) return { images, download: images[0].blob, name: images[0].name, markdown };
  options.onProgress("Preparing your ZIP…", .96);
  const { zipSync, strToU8 } = await import("fflate");
  const entries: Record<string, Uint8Array> = { "source.md": strToU8(markdown) };
  for (const image of images) entries[image.name] = new Uint8Array(await image.blob.arrayBuffer());
  checkAbort(options.signal);
  const zip = zipSync(entries, { level: 0 });
  return { images, download: new Blob([new Uint8Array(zip)], { type: "application/zip" }), name: `${slugify(snapshot.name)}-images.zip`, markdown };
}

export { downloadBlob } from "./download";
