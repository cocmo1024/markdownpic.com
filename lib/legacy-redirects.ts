/**
 * Pages from the former markdownpic.com reference site (retired October 2026) whose topic matches a
 * current page. Only relevant matches redirect; unrelated articles stay 404 rather than being sent
 * somewhere that does not answer them.
 */
export const legacyRedirects: Record<string, string> = {
  "/tool": "/",
  "/terms-of-use": "/terms",
  "/sitemap-index.xml": "/sitemap.xml",
  "/sitemap-0.xml": "/sitemap.xml",
  "/guides/markdown-to-image-workflows-for-docs-social-and-ai-content": "/guides/markdown-to-image",
  "/guides/export-safe-markdown-authoring-for-pdf-email-and-social": "/guides/markdown-to-image",
  "/guides/markdown-badges-and-clickable-images-for-readmes-docs-and-social-cards": "/guides/markdown-to-image",
  "/faq/why-is-my-markdown-table-not-rendering": "/guides/markdown-table-to-image",
  "/faq/why-are-line-breaks-inside-my-markdown-table-not-working": "/guides/markdown-table-to-image",
  "/syntax/markdown-tables-that-survive-mobile-pdf-and-image-export": "/guides/markdown-table-to-image",
  "/syntax/markdown-table-alignment-and-column-formatting-that-survives-export": "/guides/markdown-table-to-image",
  "/guides/html-tables-vs-pipe-tables-for-portable-markdown": "/guides/markdown-table-to-image",
  "/faq/why-is-my-mermaid-diagram-not-rendering-in-markdown": "/guides/mermaid-to-png",
  "/fundamentals/mermaid-diagrams-in-markdown-where-they-render-and-where-they-dont": "/guides/mermaid-to-png",
  "/faq/why-is-my-markdown-math-not-rendering": "/guides/latex-math-to-image",
  "/fundamentals/markdown-math-and-diagrams-where-standard-syntax-stops": "/guides/latex-math-to-image",
  "/syntax/markdown-code-blocks-fenced-vs-indented": "/guides/code-to-image",
  "/syntax/markdown-horizontal-rules-page-breaks-and-section-dividers": "/guides/markdown-carousel",
  "/syntax/markdown-cheat-sheet-with-standard-examples": "/help",
  // Added from Search Console impressions (October 2026).
  "/posts/convert-markdown-to-long-image": "/guides/long-image",
  "/syntax/markdown-table-rowspan-and-colspan-why-html-is-required": "/guides/markdown-table-to-image",
};

/** The redirect target for a legacy path (trailing slash and case-insensitive), or null. */
export function legacyRedirect(pathname: string): string | null {
  const key = pathname.length > 1 ? pathname.replace(/\/+$/, "").toLowerCase() : pathname;
  return legacyRedirects[key] ?? null;
}
