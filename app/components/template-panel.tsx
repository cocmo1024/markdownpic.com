"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Modal } from "./modal";
import { CaptureCard } from "./capture-card";
import { defaultDesign, presetFor } from "@/lib/studio-model";
import { splitMarkdownPages } from "@/lib/markdown-document";
import { templateCategories, templateDesign, templates, type TemplateCategory } from "@/lib/templates";
import type { BrandKit } from "@/lib/brand-kit";

/** Scales a card into its frame: fixed canvases fit whole, auto-height cards fill the width from the top. */
function FitPreview({ width, height, children }: { width: number; height: number | null; children: ReactNode }) {
  const frame = useRef<HTMLSpanElement>(null);
  const [box, setBox] = useState({ scale: .45, left: 0 });
  useLayoutEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      const byWidth = element.clientWidth / width;
      const scale = height ? Math.min(byWidth, (element.clientHeight - 20) / height) : byWidth;
      setBox({ scale, left: height ? (element.clientWidth - width * scale) / 2 : 0 });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [width, height]);
  return <span ref={frame} className={"template-sample" + (height ? " is-fixed" : "")} aria-hidden="true"><span style={{ transform: "scale(" + box.scale + ")", left: box.left }}>{children}</span></span>;
}

export function TemplatePanel({ disabled, brand, onOpen, onClose }: { disabled: boolean; brand: BrandKit | null; onOpen: (id: string) => void; onClose: () => void }) {
  const [category, setCategory] = useState<TemplateCategory | "all">("all");
  const shown = category === "all" ? templateCategories : templateCategories.filter(item => item.id === category);
  return <Modal title="Start from a template" wide onClose={onClose}>
    <div className="template-head">
      <p className="modal-intro">Each template opens as a new project with its own theme. Your current work is saved.</p>
      <div className="template-filter" role="group" aria-label="Template categories">
        {([{ id: "all", label: "All" }, ...templateCategories] as const).map(item => <button key={item.id} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.label}</button>)}
      </div>
    </div>
    {shown.map(group => <section key={group.id} className="template-group" aria-labelledby={"templates-" + group.id}>
      <header><h3 id={"templates-" + group.id}>{group.label}</h3><p>{group.note}</p></header>
      <div className="template-grid">{templates.filter(template => template.category === group.id).map(template => {
        const design = templateDesign(defaultDesign, template);
        const preset = presetFor(design);
        const slides = splitMarkdownPages(template.markdown);
        return <button className="template-option" disabled={disabled} key={template.id} onClick={() => onOpen(template.id)}>
          <FitPreview width={preset.width} height={preset.height}><CaptureCard markdown={slides[0].markdown} design={design} assetUrls={{}} brand={brand} /></FitPreview>
          <strong>{template.name}{slides.length > 1 && <small>{slides.length} slides</small>}</strong>
          <span>{template.description}</span>
        </button>;
      })}</div>
    </section>)}
  </Modal>;
}
