"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { findMatches, outline, replaceAll } from "@/lib/markdown-edits";
import { mirrorRanges, revealRange } from "./markdown-editor";
import { Icon } from "./icons";

/** Find and replace inside the current editor text. Enter = next, Shift+Enter = previous, Esc = close. */
export function FindBar({ value, textareaRef, initialQuery, startWithReplace, onReplace, onClose }: {
  value: string; textareaRef: RefObject<HTMLTextAreaElement | null>; initialQuery: string; startWithReplace: boolean;
  onReplace: (value: string) => void; onClose: () => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [replacement, setReplacement] = useState("");
  const [showReplace, setShowReplace] = useState(startWithReplace);
  const [matchCase, setMatchCase] = useState(false);
  const [current, setCurrent] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const matches = useMemo(() => findMatches(value, query, matchCase), [value, query, matchCase]);
  const index = matches.length ? Math.min(current, matches.length - 1) : -1;

  useEffect(() => { input.current?.focus(); input.current?.select(); }, []);

  // Paint matches on the mirror with the CSS Custom Highlight API; the DOM is not touched.
  useEffect(() => {
    const registry = typeof CSS !== "undefined" ? CSS.highlights : undefined;
    if (!registry || typeof Highlight === "undefined") return;
    // Wait one frame so the mirror reflects the latest text before ranges are measured.
    const frame = requestAnimationFrame(() => {
      const visible = matches.slice(0, 2000);
      registry.set("md-find", new Highlight(...mirrorRanges(textareaRef.current, visible)));
      registry.set("md-find-current", new Highlight(...(index >= 0 ? mirrorRanges(textareaRef.current, [matches[index]]) : [])));
    });
    return () => { cancelAnimationFrame(frame); registry.delete("md-find"); registry.delete("md-find-current"); };
  }, [matches, index, textareaRef]);

  const go = (step: number) => {
    if (!matches.length) return;
    const next = (index + step + matches.length) % matches.length;
    setCurrent(next);
    revealRange(textareaRef.current, matches[next][0], matches[next][1], false);
  };
  const replaceOne = () => {
    if (index < 0) return;
    const [start, end] = matches[index];
    onReplace(value.slice(0, start) + replacement + value.slice(end));
  };
  const replaceEvery = () => { const result = replaceAll(value, query, replacement, matchCase); if (result.count) onReplace(result.value); };

  return <div className="find-bar" role="search" aria-label="Find in Markdown" onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); onClose(); } }}>
    <div className="find-row">
      <input ref={input} aria-label="Find" placeholder="Find" value={query} onChange={event => { setQuery(event.target.value); setCurrent(0); }} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); go(event.shiftKey ? -1 : 1); } }} />
      <span className="find-count" aria-live="polite">{query ? (matches.length ? index + 1 + "/" + matches.length : "0") : ""}</span>
      <button className="find-toggle" aria-pressed={matchCase} title="Match case" onClick={() => setMatchCase(value => !value)}>Aa</button>
      <button className="tool-button" title="Previous (Shift+Enter)" aria-label="Previous match" disabled={!matches.length} onClick={() => go(-1)}><Icon name="left" /></button>
      <button className="tool-button" title="Next (Enter)" aria-label="Next match" disabled={!matches.length} onClick={() => go(1)}><Icon name="right" /></button>
      <button className="tool-button" title="Replace" aria-label="Toggle replace" aria-pressed={showReplace} onClick={() => setShowReplace(value => !value)}><Icon name="replace" /></button>
      <button className="tool-button" title="Close (Esc)" aria-label="Close find" onClick={onClose}><Icon name="close" /></button>
    </div>
    {showReplace && <div className="find-row">
      <input aria-label="Replace with" placeholder="Replace with" value={replacement} onChange={event => setReplacement(event.target.value)} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); replaceOne(); } }} />
      <button className="find-action" disabled={index < 0} onClick={replaceOne}>Replace</button>
      <button className="find-action" disabled={!matches.length} onClick={replaceEvery}>All</button>
    </div>}
  </div>;
}

/** Jump-to-heading menu built from the Markdown headings. */
export function OutlineMenu({ value, textareaRef, disabled }: { value: string; textareaRef: RefObject<HTMLTextAreaElement | null>; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const items = useMemo(() => open ? outline(value) : [], [open, value]);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => { if (event instanceof KeyboardEvent ? event.key === "Escape" : !root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close); document.addEventListener("keydown", close);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", close); };
  }, [open]);
  return <div className="outline-menu" ref={root}>
    <button className="tool-button" title="Outline: jump to a heading" aria-label="Outline" aria-expanded={open} disabled={disabled} onClick={() => setOpen(value => !value)}><Icon name="outline" /></button>
    {open && <div className="outline-popover" role="menu">{items.length ? items.map(item => <button key={item.offset} role="menuitem" className={"outline-item level-" + item.level} onClick={() => { setOpen(false); revealRange(textareaRef.current, item.offset, item.offset); }}>{item.text}</button>) : <p>Add headings with <code>#</code> to build an outline.</p>}</div>}
  </div>;
}
