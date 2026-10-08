"use client";
/* Local export blobs must be displayed without a server image optimizer. */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, type RefObject } from "react";
import { Modal } from "./modal";
import type { ExportResult } from "@/lib/capture-engine";
import { downloadBlob } from "@/lib/download";
import { withDeadline } from "@/lib/async-deadline";
import { Icon } from "./icons";

export function ResultPanel({ result, onClose, onCopyLink, onSetUpBrand, returnFocusRef }: { result: ExportResult; onClose: () => void; onCopyLink?: () => void; onSetUpBrand?: () => void; returnFocusRef?: RefObject<HTMLElement | null> }) {
  const [urls, setUrls] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [touchShare] = useState(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches && Boolean(navigator.canShare?.({ files: [new File([""], "x.png", { type: "image/png" })] })));
  const image = result.images[index];
  useEffect(() => {
    const next = result.images.map(item => URL.createObjectURL(item.blob));
    // Object URLs are external resources; creation and revocation belong to the effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrls(next);
    return () => next.forEach(url => URL.revokeObjectURL(url));
  }, [result]);
  const share = () => {
    const file = new File([image.blob], image.name, { type: image.blob.type });
    if (!navigator.canShare?.({ files: [file] })) { setMessage("File sharing is unavailable here. Download the image or open it to save it."); return; }
    void navigator.share({ files: [file] }).catch(error => { if (error?.name !== "AbortError") setMessage("Sharing was not completed. You can download the image instead."); });
  };
  const copy = () => {
    if (image.blob.type !== "image/png") { setMessage("Choose PNG in export options to copy an image."); return; }
    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") { setMessage("Image copy is not supported here. Download or share the image instead."); return; }
    setMessage("Copying image… Allow clipboard access if your browser asks.");
    void withDeadline(navigator.clipboard.write([new ClipboardItem({ "image/png": image.blob })]), { timeoutMs: 10_000, message: "Clipboard access did not finish. Use Download or Open image instead." }).then(() => setMessage("Image copied. Paste it anywhere.")).catch(error => setMessage(error instanceof Error ? error.message + " You can download the image instead." : "Clipboard access was blocked. Use Download or Share instead."));
  };
  const copyAlt = () => {
    if (!navigator.clipboard?.writeText) { setMessage("Text copy is unavailable in this browser."); return; }
    void withDeadline(navigator.clipboard.writeText(image.alt), { timeoutMs: 10_000, message: "Clipboard access did not finish." }).then(() => setMessage("Alt text copied. Paste it into the image description when you post.")).catch(() => setMessage("Alt text could not be copied. Allow clipboard access and try again."));
  };
  const copySource = () => {
    if (!navigator.clipboard?.writeText) { setMessage("Text copy is unavailable. Use Save Markdown instead."); return; }
    void withDeadline(navigator.clipboard.writeText(result.markdown), { timeoutMs: 10_000, message: "Clipboard access did not finish." }).then(() => setMessage("Markdown copied.")).catch(() => setMessage("Markdown could not be copied. Use Save Markdown instead."));
  };
  return <Modal title="Your image is ready" wide onClose={onClose} returnFocusRef={returnFocusRef}>
    <p className="modal-intro">This is the exact file that will be saved. Download it, copy it, or take it from More.</p>
    <div className="export-result-preview">{urls[index] && <img src={urls[index]} alt={"Actual exported image, page " + image.page} />}</div>
    <div className="result-meta">{image.width} × {image.height} px · {image.blob.size >= 1_000_000 ? (image.blob.size / 1_000_000).toFixed(1) + " MB" : Math.ceil(image.blob.size / 1000) + " KB"} · {image.name}</div>
    {result.images.length > 1 && <label className="result-page-label">Inspect exported page<select value={index} onChange={event => setIndex(Number(event.target.value))}>{result.images.map((item, i) => <option key={item.name} value={i}>Page {item.page}</option>)}</select></label>}
    {message && <p role="status" className="result-message">{message}</p>}
    {onSetUpBrand && <div className="brand-nudge"><span>Sign every image with your name and avatar, automatically.</span><button onClick={onSetUpBrand}>Set up my brand</button></div>}
    <div className="modal-footer result-actions">
      <button className="primary-button" onClick={() => downloadBlob(result.download, result.name)}><Icon name="download" />{result.name.endsWith(".zip") ? "Download ZIP · " + result.images.length + " images" : "Download " + (result.name.split(".").pop() ?? "image").toUpperCase().replace("JPG", "JPEG")}</button>
      <button onClick={copy}><Icon name="copy" />Copy image</button>
      <button title="A plain-text description for X, LinkedIn, Mastodon or Bluesky" onClick={copyAlt}><Icon name="doc-text" />Copy alt text</button>
      {touchShare && <button onClick={share}><Icon name="share" />Share</button>}
      <details className="more-menu">
        <summary className="button-link" aria-label="More actions"><Icon name="more" />More</summary>
        <div className="more-popover" role="menu">
          <a role="menuitem" href={urls[index]} target="_blank" rel="noopener noreferrer"><Icon name="arrow" />Open image in a new tab</a>
          {onCopyLink && <button role="menuitem" onClick={onCopyLink}><Icon name="link" />Copy editable link</button>}
          <button role="menuitem" onClick={copySource}><Icon name="file" />Copy Markdown</button>
          <button role="menuitem" onClick={() => downloadBlob(new Blob([result.markdown], { type: "text/markdown;charset=utf-8" }), result.name.replace(/\.[^.]+$/, "") + ".md")}><Icon name="download" />Save Markdown</button>
          {result.images.length > 1 && <button role="menuitem" onClick={() => downloadBlob(image.blob, image.name)}><Icon name="image" />Save this page only</button>}
        </div>
      </details>
    </div>
  </Modal>;
}
