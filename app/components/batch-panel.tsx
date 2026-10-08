"use client";

import { useMemo, useRef, useState } from "react";
import { Modal } from "./modal";
import { CaptureCard } from "./capture-card";
import { Icon } from "./icons";
import { fillTemplate, parseTable, placeholdersIn, planBatch } from "@/lib/batch";
import { MAX_PAGES, presetFor, type Design } from "@/lib/studio-model";
import type { BrandKit } from "@/lib/brand-kit";

const PREVIEW_WIDTH = 300;

/** One image per row: the current page is the template, a pasted table or CSV is the data. */
export function BatchPanel({ template, design, brand, assetUrls, disabled, onExport, onOpenAsPages, onClose }: {
  template: string; design: Design; brand: BrandKit | null; assetUrls: Record<string, string>; disabled: boolean;
  onExport: (markdowns: string[], names: string[]) => void; onOpenAsPages: (markdowns: string[]) => void; onClose: () => void;
}) {
  const [data, setData] = useState("");
  const [row, setRow] = useState(0);
  const [nameColumn, setNameColumn] = useState("");
  const [error, setError] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const placeholders = useMemo(() => placeholdersIn(template).filter(name => !/^(n|total)$/i.test(name)), [template]);
  const plan = useMemo(() => planBatch(parseTable(data), template), [data, template]);
  const markdowns = useMemo(() => plan.records.map((record, i) => fillTemplate(template, record, i, plan.records.length)), [plan, template]);
  const current = Math.min(row, Math.max(0, markdowns.length - 1));
  const preset = presetFor(design);
  const scale = PREVIEW_WIDTH / preset.width;
  const names = plan.records.map((record, i) => (nameColumn && record[nameColumn.toLowerCase()]) || String(i + 1));

  const example = () => setData(placeholders.length
    ? [placeholders.join("\t"), ...[1, 2, 3].map(n => placeholders.map(name => `${name} ${n}`).join("\t"))].join("\n")
    : ["Stay curious.", "Ship small, ship often.", "Clarity is a form of respect."].join("\n"));

  return <Modal title="Batch: one image per row" wide onClose={onClose}>
    <div className="batch-layout">
      <div className="batch-inputs settings-content">
        <div className="batch-template">
          <strong>Template: the current page</strong>
          {placeholders.length
            ? <p>Fills {placeholders.map(name => <code key={name}>{"{{" + name + "}}"}</code>)} from columns with the same names. <code>{"{{n}}"}</code> is the row number.</p>
            : <p>No <code>{"{{placeholders}}"}</code> in this page, so each row becomes a card’s whole text, with this page’s style. Add placeholders like <code>{"{{title}}"}</code> to keep a fixed layout.</p>}
        </div>
        <label>Rows<textarea className="batch-data" rows={8} spellCheck={false} value={data} placeholder={placeholders.length ? `Paste from Excel or Google Sheets, with a header row:\n${placeholders.join("\t")}\n…` : "Paste rows from a spreadsheet, or one line per card."} onChange={event => { setData(event.target.value); setRow(0); }} /></label>
        <div className="batch-tools">
          <button onClick={() => file.current?.click()}><Icon name="file" />Open CSV</button>
          <button className="link-button" onClick={example}>Fill with an example</button>
          <input ref={file} type="file" className="sr-only" tabIndex={-1} accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain" aria-label="Open a CSV file" onChange={event => {
            const chosen = event.target.files?.[0]; event.target.value = "";
            if (!chosen) return;
            if (chosen.size > 2_000_000) { setError("This file is larger than 2 MB. Split it into smaller batches."); return; }
            void chosen.text().then(text => { setData(text); setRow(0); setError(""); });
          }} />
        </div>
        {data.trim() && <p className="batch-summary">{plan.records.length} {plan.records.length === 1 ? "image" : "images"}{plan.usesHeader ? " · columns: " + plan.headers.join(", ") : ""}{plan.truncated ? " · only the first 100 rows are used" : ""}</p>}
        {plan.missing.length > 0 && <p className="batch-warning">No column for {plan.missing.map(name => "{{" + name + "}}").join(", ")}. Those placeholders will be empty.</p>}
        {plan.usesHeader && <label>File names<select value={nameColumn} onChange={event => setNameColumn(event.target.value)}><option value="">Row number</option>{plan.headers.filter(Boolean).map(header => <option key={header} value={header}>From “{header}”</option>)}</select></label>}
        {error && <p className="batch-warning" role="alert">{error}</p>}
      </div>
      <div className="batch-preview">
        <div className="batch-frame" style={{ width: PREVIEW_WIDTH, height: preset.height ? preset.height * scale : undefined, maxHeight: 420 }}>
          {markdowns.length
            ? <span style={{ zoom: scale }}><CaptureCard markdown={markdowns[current]} design={design} assetUrls={assetUrls} brand={brand} /></span>
            : <p>Paste rows to preview each image.</p>}
        </div>
        {markdowns.length > 1 && <div className="batch-stepper"><button aria-label="Previous row" disabled={current === 0} onClick={() => setRow(current - 1)}><Icon name="left" /></button><span>{current + 1} / {markdowns.length}</span><button aria-label="Next row" disabled={current >= markdowns.length - 1} onClick={() => setRow(current + 1)}><Icon name="right" /></button></div>}
      </div>
    </div>
    <div className="modal-footer">
      <button disabled={disabled || !markdowns.length || markdowns.length > MAX_PAGES} title={markdowns.length > MAX_PAGES ? `Pages hold up to ${MAX_PAGES}; export the batch instead.` : "Open the rows as pages in a new project to adjust them one by one"} onClick={() => onOpenAsPages(markdowns)}>Open as pages</button>
      <button className="primary-button" disabled={disabled || !markdowns.length} onClick={() => onExport(markdowns, names)}>{markdowns.length ? `Export ${markdowns.length} ${markdowns.length === 1 ? "image" : "images"}` : "Export"}<Icon name="arrow" /></button>
    </div>
  </Modal>;
}
