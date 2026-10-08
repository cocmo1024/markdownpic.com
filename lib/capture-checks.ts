export interface CaptureIssue { code: "empty" | "loading" | "asset" | "width" | "height" | "size"; message: string }

/** Shared preflight for both the displayed card and the frozen export surface. */
export function inspectCard(card: HTMLElement): CaptureIssue | null {
  const content = card.querySelector<HTMLElement>(".capture-content");
  if (!content) return { code: "loading", message: "Preparing the preview…" };
  if (card.querySelector("[data-capture-pending]")) return { code: "loading", message: "Rendering math or diagrams…" };
  const problem = card.querySelector<HTMLElement>("[data-capture-error]");
  if (problem) return { code: "asset", message: problem.dataset.captureError ?? "An image could not be loaded." };
  if (!content.textContent?.trim() && !content.querySelector("img,svg")) return { code: "empty", message: "This page is empty. Add some content before exporting." };
  for (const image of card.querySelectorAll("img")) {
    if (!image.complete) return { code: "loading", message: "Loading images…" };
    if (!image.naturalWidth) return { code: "asset", message: "An image could not be loaded. Try inserting a local image instead." };
  }
  if (card.scrollWidth > card.clientWidth + 2 || content.scrollWidth > content.clientWidth + 2) return { code: "width", message: "A table, formula, or diagram is too wide. Choose a wider size or reduce its size." };
  if (card.scrollHeight > card.clientHeight + 2) return { code: "height", message: "Content is taller than this canvas. Use Auto height or split it into pages." };
  return null;
}

/** Safe everywhere, including phones. */
export const STANDARD_LIMITS = { edge: 16384, pixels: 24_000_000, batch: 80_000_000 };
/** Long images on browsers that proved they can allocate the canvas (desktop Chrome, Edge, Firefox). */
export const EXTENDED_LIMITS = { edge: 32767, pixels: 120_000_000, batch: 160_000_000 };

export function assertExportSize(width: number, height: number, totalPixels = 0, limits = STANDARD_LIMITS) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || !Number.isFinite(totalPixels) || width <= 0 || height <= 0 || totalPixels < 0 || width > limits.edge || height > limits.edge || width * height > limits.pixels || totalPixels + width * height > limits.batch) {
    throw new Error("This image is too large for this browser. Use 2× or 1× resolution, a smaller text size, or split it into pages.");
  }
}
