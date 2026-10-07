"use client";

import { useMemo, useRef, type ClipboardEvent, type CSSProperties, type RefObject } from "react";
import { highlightMarkdown } from "@/lib/markdown-highlight";

export function MarkdownEditor({ value, onChange, onPaste, textareaRef, fontSize, disabled, label, placeholder }: {
  value: string; onChange: (value: string) => void; onPaste: (event: ClipboardEvent<HTMLTextAreaElement>) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>; fontSize: number; disabled: boolean; label: string; placeholder: string;
}) {
  const mirror = useRef<HTMLDivElement>(null);
  // A trailing space keeps the final empty line measurable, exactly like the textarea.
  const html = useMemo(() => highlightMarkdown(value) + " ", [value]);
  const style = { "--editor-font-size": fontSize + "px" } as CSSProperties;
  return <div className="md-editor" style={style}>
    <div ref={mirror} className="md-mirror" aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />
    <textarea ref={textareaRef} aria-label={label} spellCheck={false} autoCapitalize="off" autoCorrect="off" value={value} disabled={disabled} placeholder={placeholder}
      onChange={event => onChange(event.target.value)} onPaste={onPaste}
      onScroll={event => { if (mirror.current) { mirror.current.scrollTop = event.currentTarget.scrollTop; mirror.current.scrollLeft = event.currentTarget.scrollLeft; } }} />
  </div>;
}
