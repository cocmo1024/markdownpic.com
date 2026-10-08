"use client";

import { useMemo, useRef, type ClipboardEvent, type CSSProperties, type KeyboardEvent, type RefObject } from "react";
import { highlightMarkdown } from "@/lib/markdown-highlight";
import { continueBlock, indentLines, linkOnPaste, wrapSelection, type Edit } from "@/lib/markdown-edits";

const WRAPS: Record<string, [string, string, string]> = { b: ["**", "**", "bold text"], i: ["*", "*", "italic text"], e: ["`", "`", "code"], k: ["[", "](https://)", "link text"] };

export function MarkdownEditor({ value, onChange, onEdit, onPaste, onScrollRatio, textareaRef, fontSize, disabled, label, placeholder }: {
  value: string; onChange: (value: string) => void; onEdit: (value: string) => void; onPaste: (event: ClipboardEvent<HTMLTextAreaElement>) => void;
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
    commit(linkOnPaste(value, start, end, event.clipboardData.getData("text/plain")), event);
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
