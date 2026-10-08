"use client";

import { useMemo, useRef, type ClipboardEvent, type CSSProperties, type KeyboardEvent, type RefObject } from "react";
import { highlightMarkdown } from "@/lib/markdown-highlight";
import { continueBlock, indentLines, linkOnPaste, wrapSelection, type Edit } from "@/lib/markdown-edits";
import { htmlToMarkdown, shouldConvertHtml } from "@/lib/smart-paste";

/** DOM Ranges over the mirror's text for character offsets (the mirror holds exactly the editor's text). */
export function mirrorRanges(area: HTMLTextAreaElement | null, spans: Array<[number, number]>): Range[] {
  const mirror = area?.parentElement?.querySelector<HTMLElement>(".md-mirror");
  if (!mirror || !spans.length) return [];
  const nodes: Array<{ node: Text; start: number }> = [];
  const walker = document.createTreeWalker(mirror, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode() as Text | null, offset = 0; node; offset += node.length, node = walker.nextNode() as Text | null) nodes.push({ node, start: offset });
  const locate = (offset: number) => {
    let low = 0, high = nodes.length - 1;
    while (low < high) { const mid = (low + high + 1) >> 1; if (nodes[mid].start <= offset) low = mid; else high = mid - 1; }
    const item = nodes[low];
    return item ? { node: item.node, offset: Math.min(offset - item.start, item.node.length) } : null;
  };
  return spans.flatMap(([start, end]) => {
    const from = locate(start), to = locate(end);
    if (!from || !to) return [];
    const range = document.createRange();
    range.setStart(from.node, from.offset); range.setEnd(to.node, to.offset);
    return [range];
  });
}

/** Selects [start, end) and scrolls it into view, measuring wrapped lines through the mirror. */
export function revealRange(area: HTMLTextAreaElement | null, start: number, end = start, focus = true) {
  if (!area) return;
  if (focus) area.focus({ preventScroll: true });
  area.setSelectionRange(start, end);
  const mirror = area.parentElement?.querySelector<HTMLElement>(".md-mirror");
  if (!mirror) return;
  const walker = document.createTreeWalker(mirror, NodeFilter.SHOW_TEXT);
  let remaining = start;
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    if (remaining <= node.length) {
      const range = document.createRange();
      range.setStart(node, Math.min(remaining, node.length));
      const box = range.getClientRects()[0] ?? range.getBoundingClientRect();
      const top = box.top - mirror.getBoundingClientRect().top + mirror.scrollTop;
      area.scrollTop = Math.max(0, top - area.clientHeight / 3);
      return;
    }
    remaining -= node.length;
  }
}

const WRAPS: Record<string, [string, string, string]> = { b: ["**", "**", "bold text"], i: ["*", "*", "italic text"], e: ["`", "`", "code"], k: ["[", "](https://)", "link text"] };

export function MarkdownEditor({ value, onChange, onEdit, onPaste, onScrollRatio, onFind, onNotice, textareaRef, fontSize, disabled, label, placeholder }: {
  value: string; onChange: (value: string) => void; onEdit: (value: string) => void; onPaste: (event: ClipboardEvent<HTMLTextAreaElement>) => void; onFind?: (replace: boolean) => void; onNotice?: (message: string) => void;
  onScrollRatio?: (ratio: number) => void; textareaRef: RefObject<HTMLTextAreaElement | null>; fontSize: number; disabled: boolean; label: string; placeholder: string;
}) {
  const mirror = useRef<HTMLDivElement>(null);
  // A trailing space keeps the final empty line measurable, exactly like the textarea.
  const html = useMemo(() => highlightMarkdown(value) + " ", [value]);
  const style = { "--editor-font-size": fontSize + "px" } as CSSProperties;

  // Structured edits are separate history steps; the caret is restored after React commits the value.
  const commit = (edit: Edit | null, event: { preventDefault(): void }) => {
    if (!edit) return;
    event.preventDefault();
    onEdit(edit.value);
    const area = textareaRef.current;
    requestAnimationFrame(() => { if (area && area.value === edit.value) area.setSelectionRange(edit.start, edit.end); });
  };

  const keyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing) return;
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && !event.altKey && (key === "f" || key === "h") && onFind) { event.preventDefault(); event.stopPropagation(); onFind(key === "h"); return; }
    const { selectionStart: start, selectionEnd: end } = event.currentTarget;
    const wrap = (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey ? WRAPS[event.key.toLowerCase()] : undefined;
    if (wrap) { event.stopPropagation(); commit(wrapSelection(value, start, end, ...wrap), event); }
    else if (event.key === "Enter" && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) commit(continueBlock(value, start, end), event);
    else if (event.key === "Tab" && !event.ctrlKey && !event.metaKey && !event.altKey) commit(indentLines(value, start, end, event.shiftKey), event);
  };

  const paste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    onPaste(event);
    if (event.defaultPrevented) return;
    const { selectionStart: start, selectionEnd: end } = event.currentTarget;
    const plain = event.clipboardData.getData("text/plain"), html = event.clipboardData.getData("text/html");
    commit(linkOnPaste(value, start, end, plain), event);
    if (event.defaultPrevented || !shouldConvertHtml(html, plain)) return;
    // Rich text from web pages, Notion or Docs: convert its formatting instead of losing it.
    event.preventDefault();
    const base = value, area = event.currentTarget;
    const insert = (text: string, converted: boolean) => {
      const next = base.slice(0, start) + text + base.slice(end);
      onEdit(next);
      requestAnimationFrame(() => { if (area.value === next) area.setSelectionRange(start + text.length, start + text.length); });
      if (converted) onNotice?.("Formatting pasted as Markdown. For plain text, paste with Ctrl/⌘ Shift V.");
    };
    htmlToMarkdown(html).then(markdown => insert(markdown || plain, Boolean(markdown)), () => insert(plain, false));
  };

  return <div className="md-editor" style={style}>
    <div ref={mirror} className="md-mirror" aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />
    <textarea ref={textareaRef} aria-label={label} spellCheck={false} autoCapitalize="off" autoCorrect="off" value={value} disabled={disabled} placeholder={placeholder}
      onChange={event => onChange(event.target.value)} onKeyDown={keyDown} onPaste={paste}
      onScroll={event => {
        const area = event.currentTarget;
        if (mirror.current) { mirror.current.scrollTop = area.scrollTop; mirror.current.scrollLeft = area.scrollLeft; }
        const range = area.scrollHeight - area.clientHeight;
        if (range > 0) onScrollRatio?.(area.scrollTop / range);
      }} />
  </div>;
}
