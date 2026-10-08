/**
 * Alt text for posting an image: the content as readable plain text. X, LinkedIn, Mastodon and
 * Bluesky accept image descriptions; X caps them at 1,000 characters.
 */
export const ALT_TEXT_LIMIT = 1000;

export function markdownToAltText(markdown: string, limit = ALT_TEXT_LIMIT) {
  const lines: string[] = [];
  let fence = "", language = "";
  for (const raw of markdown.split("\n")) {
    const opener = /^\s*(`{3,}|~{3,})\s*([\w+-]*)/.exec(raw);
    if (fence) {
      if (opener && opener[1][0] === fence[0] && opener[1].length >= fence.length) { fence = ""; continue; }
      if (language !== "mermaid") lines.push(raw.trim());
      continue;
    }
    if (opener) { fence = opener[1]; language = opener[2].toLowerCase(); lines.push(language === "mermaid" ? "Diagram." : language ? `Code (${language}):` : "Code:"); continue; }
    if (/^\s*<!--\s*page\s*-->\s*$/i.test(raw) || /^\s*\|?\s*:?-{3,}/.test(raw)) continue;
    let line = raw
      .replace(/^\s{0,3}#{1,6}\s+/, "")
      .replace(/^\s*>\s?/, "")
      .replace(/^\s*[-*+]\s+\[[ xX]\]\s+/, "")
      .replace(/^\s*[-*+]\s+/, "")
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, (_, alt: string) => alt ? `Image: ${alt}.` : "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/(\*\*|__|\*|_|~~|`)(?=\S)([^\n]*?\S)\1/g, "$2")
      .replace(/\$\$?([^$]+)\$\$?/g, "$1")
      .replace(/<[^>]+>/g, "");
    if (/^\s*\|.*\|\s*$/.test(line)) line = line.split("|").map(cell => cell.trim()).filter(Boolean).join(", ");
    lines.push(line.trim());
  }
  const text = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim()
    .split("\n\n").map(block => block.replace(/\n(?!\n)/g, " ").replace(/\s{2,}/g, " ")).join("\n");
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit - 1);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), limit * .8)).trimEnd() + "…";
}
