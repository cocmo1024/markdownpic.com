"use client";
/* Local export blobs must be displayed without a server image optimizer. */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, type ReactNode, type RefObject } from "react";
import { Modal } from "./modal";
import type { ExportResult } from "@/lib/capture-engine";
import { downloadBlob } from "@/lib/download";
import { withDeadline } from "@/lib/async-deadline";
import { Icon, type IconName } from "./icons";

/** The clipboard accepts PNG only; JPEG and WebP exports are converted on the fly. */
async function asPng(blob: Blob) {
  if (blob.type === "image/png") return blob;
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  try {
    canvas.width = bitmap.width; canvas.height = bitmap.height;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
    const png = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"));
    if (!png) throw new Error("This image could not be prepared for the clipboard.");
    return png;
  } finally { bitmap.close(); canvas.width = 0; canvas.height = 0; }
}

/** The system share sheet is dependable on phones, tablets and Macs; on Windows it often fails. */
function canUseShareSheet() {
  if (typeof navigator === "undefined" || !navigator.canShare) return false;
  const platform = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ?? navigator.platform ?? "";
  if (/win/i.test(platform)) return false;
  return navigator.canShare({ files: [new File([""], "image.png", { type: "image/png" })] });
}

function Action({ icon, label, hint, done, primary, onClick, href }: { icon: IconName; label: ReactNode; hint?: string; done?: boolean; primary?: boolean; onClick?: () => void; href?: string }) {
  const content = <><span className="action-icon" aria-hidden="true"><Icon name={done ? "check" : icon} /></span><span className="action-text"><strong>{label}</strong>{hint && <small>{hint}</small>}</span></>;
  const className = "action-row" + (primary ? " is-primary" : "") + (done ? " is-done" : "");
  return href ? <a className={className} href={href} target="_blank" rel="noopener noreferrer">{content}</a> : <button className={className} onClick={onClick}>{content}</button>;
}

export function ResultPanel({ result, onClose, onCopyLink, onSetUpBrand, returnFocusRef }: { result: ExportResult; onClose: () => void; onCopyLink?: () => void; onSetUpBrand?: () => void; returnFocusRef?: RefObject<HTMLElement | null> }) {
  const [urls, setUrls] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState("");
  const [shareSheet] = useState(canUseShareSheet);
  // On phones the share sheet is the way to save to Photos or send to an app, so it leads.
  const [shareFirst] = useState(() => shareSheet && typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
  const image = result.images[index];
  const multiple = result.images.length > 1;
  useEffect(() => {
    const next = result.images.map(item => URL.createObjectURL(item.blob));
    // Object URLs are external resources; creation and revocation belong to the effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrls(next);
    return () => next.forEach(url => URL.revokeObjectURL(url));
  }, [result]);
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => setDone(""), 2200);
    return () => clearTimeout(timer);
  }, [done]);

  const succeed = (key: string, text: string) => { setDone(key); setMessage(text); };
  const copyText = (key: string, text: string, success: string) => {
    if (!navigator.clipboard?.writeText) { setMessage("Text copy is unavailable in this browser."); return; }
    void withDeadline(navigator.clipboard.writeText(text), { timeoutMs: 10_000, message: "Clipboard access did not finish." })
      .then(() => succeed(key, success)).catch(() => setMessage("Copy was blocked. Allow clipboard access and try again."));
  };
  const copyImage = () => {
    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") { setMessage("Image copy is not supported in this browser. Download the image instead."); return; }
    // The write starts inside the click (with the PNG as a promise) so Safari accepts it.
    void withDeadline(navigator.clipboard.write([new ClipboardItem({ "image/png": asPng(image.blob) })]), { timeoutMs: 10_000, message: "Clipboard access did not finish." })
      .then(() => succeed("image", "Image copied. Paste it into a chat, document or post.")).catch(error => setMessage((error instanceof Error ? error.message : "Clipboard access was blocked.") + " You can download the image instead."));
  };
  const share = () => {
    const file = new File([image.blob], image.name, { type: image.blob.type });
    if (!navigator.canShare?.({ files: [file] })) { setMessage("Sharing is unavailable here. Copy or download the image instead."); return; }
    void navigator.share({ files: [file] }).then(() => succeed("share", "Shared.")).catch(error => { if (error?.name !== "AbortError") setMessage("Sharing did not complete. Copy or download the image instead."); });
  };
  const extension = (result.name.split(".").pop() ?? "png").toUpperCase().replace("JPG", "JPEG");
  const size = (bytes: number) => bytes >= 1_000_000 ? (bytes / 1_000_000).toFixed(1) + " MB" : Math.ceil(bytes / 1000) + " KB";

  return <Modal title="Your image is ready" wide onClose={onClose} returnFocusRef={returnFocusRef}>
    <div className="result-layout">
      <div className="result-visual">
        <div className="export-result-preview">{urls[index] && <img src={urls[index]} alt={"Exported image" + (multiple ? ", page " + image.page : "")} />}</div>
        <div className="result-meta">
          {multiple && <span className="result-pager"><button aria-label="Previous image" disabled={index === 0} onClick={() => setIndex(index - 1)}><Icon name="left" /></button>{index + 1} / {result.images.length}<button aria-label="Next image" disabled={index === result.images.length - 1} onClick={() => setIndex(index + 1)}><Icon name="right" /></button></span>}
          <span>{image.width} × {image.height} px · {size(image.blob.size)} · {image.name}</span>
        </div>
      </div>
      <div className="result-side">
        <div className={"result-groups" + (shareFirst ? " share-first" : "")}>
        <section aria-labelledby="result-save">
          <h3 id="result-save">Save</h3>
          <Action primary={!shareFirst} icon="download" label={multiple ? `Download ZIP · ${result.images.length} images` : "Download " + extension} hint={multiple ? size(result.download.size) + " · numbered images and source.md" : size(result.download.size)} onClick={() => downloadBlob(result.download, result.name)} />
          {multiple && <Action icon="image" label="Download this image only" hint={image.name} onClick={() => downloadBlob(image.blob, image.name)} />}
          <Action icon="file" label="Save Markdown" hint="The editable source as a .md file" onClick={() => downloadBlob(new Blob([result.markdown], { type: "text/markdown;charset=utf-8" }), result.name.replace(/\.[^.]+$/, "").replace(/-images$/, "") + ".md")} />
        </section>
        <section aria-labelledby="result-share">
          <h3 id="result-share">Share</h3>
          {shareSheet && <Action primary={shareFirst} icon="share" label="Share…" hint="Messages, AirDrop, mail and other apps" done={done === "share"} onClick={share} />}
          <Action icon="copy" label={done === "image" ? "Copied" : "Copy image"} hint="Paste into chats, documents or posts" done={done === "image"} onClick={copyImage} />
          {onCopyLink && <Action icon="link" label="Copy editable link" hint="Anyone with it gets their own copy to edit" onClick={() => { onCopyLink(); setDone("link"); }} done={done === "link"} />}
          <Action icon="doc-text" label={done === "alt" ? "Copied" : "Copy alt text"} hint="Image description for X, LinkedIn, Bluesky" done={done === "alt"} onClick={() => copyText("alt", image.alt, "Alt text copied. Paste it into the image description when you post.")} />
          <Action icon="file" label={done === "markdown" ? "Copied" : "Copy Markdown"} hint="The source text, ready to paste" done={done === "markdown"} onClick={() => copyText("markdown", result.markdown, "Markdown copied.")} />
          {urls[index] && <Action icon="arrow" label="Open in a new tab" hint="View at full size" href={urls[index]} />}
        </section>
        </div>
        {message && <p role="status" className="result-message">{message}</p>}
        {onSetUpBrand && <div className="brand-nudge"><span>Sign every image with your name and avatar, automatically.</span><button onClick={onSetUpBrand}>Set up my brand</button></div>}
      </div>
    </div>
  </Modal>;
}
