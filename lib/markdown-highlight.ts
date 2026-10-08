import { PAGE_BREAK_MARKER } from "./studio-model.ts";

const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const span = (kind: string, text: string) => text ? `<span class="md-${kind}">${escape(text)}</span>` : "";

// Inline tokens only recolor text; they never add or remove characters, so wrapping matches the textarea.
const INLINE = /(`+)([^`\n]+?)\1|(\*\*|__)(?=\S)([^\n]*?\S)\3|(\*|_)(?=\S)([^\s*_][^\n]*?)\5|(!?\[)([^\]\n]*)(\]\()([^)\n]*)(\))|(\$)([^$\n]+)\$/g;

function inline(text: string) {
  let html = "", last = 0;
  for (const match of text.matchAll(INLINE)) {
    html += escape(text.slice(last, match.index));
    if (match[1]) html += span("mark", match[1]) + span("code", match[2]) + span("mark", match[1]);
    else if (match[3]) html += span("mark", match[3]) + span("strong", match[4]) + span("mark", match[3]);
    else if (match[5]) html += span("mark", match[5]) + span("em", match[6]) + span("mark", match[5]);
    else if (match[7]) html += span("mark", match[7]) + span(match[7] === "![" ? "image" : "link", match[8]) + span("mark", match[9]) + span("url", match[10]) + span("mark", match[11]);
    else html += span("math", match[0]);
    last = match.index + match[0].length;
  }
  return html + escape(text.slice(last));
}

export function highlightMarkdown(source: string) {
  if (cache.size > 40_000) cache.clear();
  let fence = "";
  return source.split("\n").map(line => {
    const key = fence + "\u0000" + line;
    let entry = cache.get(key);
    if (!entry) { entry = highlightLine(line, fence); cache.set(key, entry); }
    fence = entry[1];
    return entry[0];
  }).join("\n");
}

// Lines are independent apart from fence state, so a keystroke re-highlights only the edited line.
const cache = new Map<string, [html: string, fence: string]>();

function highlightLine(line: string, fence: string): [html: string, fence: string] {
  const opener = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
  if (fence) {
    if (opener && opener[0] === fence[0] && opener.length >= fence.length) return [span("fence", line), ""];
    return [span("pre", line), fence];
  }
  if (opener) return [span("fence", line), opener];
  if (line.trim() === PAGE_BREAK_MARKER) return [span("page", line), ""];
  if (/^\s*\$\$/.test(line)) return [span("math", line), ""];
  const heading = /^(#{1,6})(\s.*)?$/.exec(line);
  if (heading) return [span("mark", heading[1]) + `<span class="md-h md-h${heading[1].length}">${inline(heading[2] ?? "")}</span>`, ""];
  if (/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(line)) return [span("mark", line), ""];
  const quote = /^(\s*(?:>\s?)+)(.*)$/.exec(line);
  if (quote) return [span("mark", quote[1]) + `<span class="md-quote">${inline(quote[2])}</span>`, ""];
  const item = /^(\s*)([-*+]|\d{1,9}[.)])(\s+)(\[[ xX]\]\s)?(.*)$/.exec(line);
  if (item) return [escape(item[1]) + span("bullet", item[2]) + item[3] + span("bullet", item[4] ?? "") + inline(item[5]), ""];
  if (/^\s*\|/.test(line)) return [line.split("|").map(cell => /^[\s:-]+$/.test(cell) && cell.includes("-") ? span("mark", cell) : inline(cell)).join(span("mark", "|")), ""];
  return [inline(line), ""];
}
