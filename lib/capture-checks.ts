export interface CaptureIssue { code: "empty" | "loading" | "asset" | "width" | "height" | "size"; message: string }

/** Shared preflight for both the displayed card and the frozen export surface. */
export function inspectCard(card: HTMLElement): CaptureIssue | null {
  const content = card.querySelector<HTMLElement>(".capture-content");
  if (!content) return { code: "loading", message: "Preparing the preview…" };
  if (card.querySelector("[data-capture-pending]")) return { code: "loading", message: "Finishing the diagram…" };
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

export function assertExportSize(width: number, height: number, totalPixels = 0) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || !Number.isFinite(totalPixels) || width <= 0 || height <= 0 || totalPixels < 0 || width > 16384 || height > 16384 || width * height > 24_000_000 || totalPixels + width * height > 80_000_000) {
    throw new Error("This export is too large for a safe browser download. Use a lower resolution, split the content, or export fewer pages.");
  }
}
