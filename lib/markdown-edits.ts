/** Pure text edits for the Markdown editor. Each returns the new value and selection, or null to let the browser act. */
export interface Edit { value: string; start: number; end: number }

const LIST_ITEM = /^(\s*)([-*+]|(\d{1,9})([.)]))(\s+)(\[[ xX]\]\s+)?/;
const QUOTE = /^(\s*(?:>\s?)+)/;

const lineStart = (value: string, index: number) => value.lastIndexOf("\n", index - 1) + 1;
const lineEnd = (value: string, index: number) => { const end = value.indexOf("\n", index); return end < 0 ? value.length : end; };
const insideFence = (value: string, index: number) => (value.slice(0, lineStart(value, index)).match(/^\s*(`{3,}|~{3,})/gm)?.length ?? 0) % 2 === 1;

/** Enter at the end of a list item or quote continues it; Enter on an empty item ends the list. */
export function continueBlock(value: string, start: number, end: number): Edit | null {
  if (start !== end || insideFence(value, start)) return null;
  const from = lineStart(value, start), line = value.slice(from, lineEnd(value, start));
  if (start - from < line.replace(/\s+$/, "").length) return null;
  const item = LIST_ITEM.exec(line), quote = item ? null : QUOTE.exec(line);
  const marker = item?.[0] ?? quote?.[1];
  if (!marker) return null;
  if (!line.slice(marker.length).trim()) {
    // An empty item: remove its marker and leave a blank line, like most editors.
    const next = value.slice(0, from) + value.slice(from + line.length);
    return { value: next, start: from, end: from };
  }
  let continuation = marker;
  if (item) {
    const [, indent, bullet, number, delimiter, space, task] = item;
    continuation = indent + (number ? String(Number(number) + 1) + delimiter : bullet) + space + (task ? "[ ] " : "");
  }
  const insert = "\n" + continuation;
  return { value: value.slice(0, start) + insert + value.slice(end), start: start + insert.length, end: start + insert.length };
}

/** Tab / Shift+Tab indent list items (or every selected line when several are selected). */
export function indentLines(value: string, start: number, end: number, outdent: boolean): Edit | null {
  const from = lineStart(value, start), to = lineEnd(value, end > start && value[end - 1] === "\n" ? end - 1 : end);
  const lines = value.slice(from, to).split("\n");
  if (lines.length === 1 && !LIST_ITEM.test(lines[0])) return null;
  let first = 0, total = 0;
  const changed = lines.map((line, i) => {
    if (!outdent) { if (i === 0) first = 2; total += 2; return "  " + line; }
    const removed = /^( {1,2}|\t)/.exec(line)?.[0].length ?? 0;
    if (i === 0) first = -removed; total -= removed;
    return line.slice(removed);
  });
  if (total === 0) return null;
  const next = value.slice(0, from) + changed.join("\n") + value.slice(to);
  return { value: next, start: Math.max(from, start + first), end: Math.max(from, end + total) };
}

/** Wraps the selection (or a placeholder) in a Markdown marker; wrapping an already wrapped selection unwraps it. */
export function wrapSelection(value: string, start: number, end: number, prefix: string, suffix: string, placeholder: string): Edit {
  const selected = value.slice(start, end);
  if (selected && value.slice(start - prefix.length, start) === prefix && value.slice(end, end + suffix.length) === suffix) {
    const next = value.slice(0, start - prefix.length) + selected + value.slice(end + suffix.length);
    return { value: next, start: start - prefix.length, end: end - prefix.length };
  }
  const text = selected || placeholder;
  const next = value.slice(0, start) + prefix + text + suffix + value.slice(end);
  return { value: next, start: start + prefix.length, end: start + prefix.length + text.length };
}

/** Pasting a URL over selected text makes a link instead of replacing the words. */
export function linkOnPaste(value: string, start: number, end: number, pasted: string): Edit | null {
  const url = pasted.trim();
  if (start === end || !/^https?:\/\/\S+$/i.test(url) || /\n/.test(value.slice(start, end))) return null;
  const link = "[" + value.slice(start, end) + "](" + url + ")";
  return { value: value.slice(0, start) + link + value.slice(end), start: start + link.length, end: start + link.length };
}

/** Every literal occurrence of `query` as [start, end] offsets. */
export function findMatches(value: string, query: string, matchCase = false): Array<[number, number]> {
  if (!query) return [];
  const haystack = matchCase ? value : value.toLowerCase(), needle = matchCase ? query : query.toLowerCase();
  const found: Array<[number, number]> = [];
  for (let at = haystack.indexOf(needle); at >= 0 && found.length < 10_000; at = haystack.indexOf(needle, at + needle.length)) found.push([at, at + needle.length]);
  return found;
}

/** Replaces every literal occurrence; replacement text is used as-is (no pattern syntax). */
export function replaceAll(value: string, query: string, replacement: string, matchCase = false) {
  const matches = findMatches(value, query, matchCase);
  let result = "", last = 0;
  for (const [start, end] of matches) { result += value.slice(last, start) + replacement; last = end; }
  return { value: result + value.slice(last), count: matches.length };
}

/** ATX headings outside code fences, for the outline. */
export function outline(value: string): Array<{ level: number; text: string; offset: number }> {
  const items: Array<{ level: number; text: string; offset: number }> = [];
  let offset = 0, fence = "";
  for (const line of value.split("\n")) {
    const opener = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
    if (fence) { if (opener && opener[0] === fence[0] && opener.length >= fence.length) fence = ""; }
    else if (opener) fence = opener;
    else {
      const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
      if (heading) items.push({ level: heading[1].length, text: heading[2].replace(/[*_`]/g, ""), offset });
    }
    offset += line.length + 1;
  }
  return items;
}
