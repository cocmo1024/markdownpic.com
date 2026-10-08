/**
 * Smart paste: rich text copied from web pages, Notion, Google Docs or Word arrives as HTML.
 * It is converted to Markdown only when the HTML carries real structure and the plain-text
 * version is not already Markdown (ChatGPT, Claude and code editors already paste Markdown).
 */
const STRUCTURE = /<(h[1-6]|strong|b|em|i|a\s[^>]*href|ul|ol|li|table|blockquote|pre|code|img|del|s)\b/i;
const MARKDOWN = /^\s{0,3}(#{1,6}\s|[-*+]\s|\d{1,9}[.)]\s|>|```|~~~|\|.*\|)|\*\*[^*\n]+\*\*|\[[^\]\n]+\]\([^)\n]+\)|`[^`\n]+`/m;

export function shouldConvertHtml(html: string, plain: string) {
  if (!html || html.length > 2_000_000 || !STRUCTURE.test(html)) return false;
  if (MARKDOWN.test(plain)) return false;
  // Code editors put syntax-colored spans in HTML; their plain text is the faithful version.
  if (/<(pre|code)\b/i.test(html) && !/<(h[1-6]|li|table|p)\b/i.test(html)) return false;
  return true;
}

export async function htmlToMarkdown(html: string) {
  const [{ default: TurndownService }, { gfm }] = await Promise.all([import("turndown"), import("turndown-plugin-gfm")]);
  const service = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced", fence: "```", bulletListMarker: "-", emDelimiter: "*", strongDelimiter: "**", linkStyle: "inlined" });
  service.use(gfm);
  service.remove(["script", "style", "meta", "link", "noscript", "iframe", "object", "embed"] as never);
  // Office and Docs wrap everything in spans with inline styles; only their text matters.
  service.addRule("drop-empty-anchors", { filter: node => node.nodeName === "A" && !node.getAttribute("href"), replacement: content => content });
  return service.turndown(html.replace(/<!--[\s\S]*?-->/g, ""))
    .replace(/\u00a0/g, " ")
    // Turndown pads list markers to four columns; one space reads like hand-written Markdown.
    .replace(/^(\s*)([-*+]|\d+\.)\s{2,}(?=\S)/gm, "$1$2 ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
