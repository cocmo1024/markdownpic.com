import { semanticBlocks, splitOversizeBlock } from "./markdown-document.ts";
import { MAX_PAGES } from "./studio-model.ts";

export type MeasurePage = (source: string) => Promise<{ fits: boolean; reason?: "width" | "height" | "asset"; message?: string }>;

/** Measurement is injected, so the pagination contract is executable in unit tests. */
export async function paginateMarkdown(source: string, measure: MeasurePage, signal?: AbortSignal) {
  const { blocks, definitions } = semanticBlocks(source);
  if (!blocks.length) throw new Error("Add some content before splitting into pages.");
  const queue = blocks.map(block => block.source);
  const pages: string[] = [];
  let current = "";
  let attempts = 0;
  const withDefinitions = (value: string) => value + (definitions ? `\n\n${definitions}` : "");
  while (queue.length) {
    if (signal?.aborted) throw new DOMException("Pagination cancelled. Your original is unchanged.", "AbortError");
    if (++attempts > 400) throw new Error("This document needs too many layout steps. Try Auto height or split it into smaller projects.");
    const next = queue.shift()!;
    const candidate = current ? `${current}\n\n${next}` : next;
    const result = await measure(withDefinitions(candidate));
    if (result.fits) { current = candidate; continue; }
    if (result.reason === "asset" || result.reason === "width") throw new Error(result.message ?? "Some content cannot fit this size. Choose a wider canvas or replace the missing image.");
    if (current) {
      pages.push(withDefinitions(current));
      if (pages.length >= MAX_PAGES) throw new Error(`This content needs more than ${MAX_PAGES} pages. Use a taller size or split it into separate projects.`);
      current = "";
      queue.unshift(next);
      continue;
    }
    const smaller = splitOversizeBlock(next);
    if (!smaller) throw new Error("A code block, diagram, image, or formula is taller than one page. Choose Story, reduce its size, or use Auto height. Your original is unchanged.");
    queue.unshift(...smaller);
  }
  if (current) pages.push(withDefinitions(current));
  return pages;
}
