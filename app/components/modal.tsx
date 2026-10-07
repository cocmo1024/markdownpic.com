"use client";

import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode, type RefObject } from "react";

function keepFocusInDialog(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== "Tab") return;
  const dialog = event.currentTarget;
  const controls = [...dialog.querySelectorAll<HTMLElement>("a[href],button,input,select,textarea,summary,[tabindex]")]
    .filter(element => element.tabIndex >= 0 && !element.matches(":disabled") && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden");
  const first = controls[0], last = controls.at(-1);
  if (!first) { event.preventDefault(); dialog.focus(); return; }
  const active = document.activeElement;
  if (event.shiftKey && (active === first || active === dialog)) {
    event.preventDefault(); last!.focus();
  } else if (!event.shiftKey && (active === last || active === dialog)) {
    event.preventDefault(); first.focus();
  }
}

export function Modal({ title, onClose, children, wide = false, drawer = false, returnFocusRef }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean; drawer?: boolean; returnFocusRef?: RefObject<HTMLElement | null> }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    const target = returnFocusRef?.current ?? previous;
    dialog?.showModal();
    return () => {
      dialog?.close();
      // Async actions temporarily disable their trigger before this dialog opens.
      // Restore an explicit target after the closing render re-enables controls.
      requestAnimationFrame(() => { if (target?.isConnected) target.focus(); });
    };
  }, [returnFocusRef]);
  return <dialog ref={ref} aria-labelledby={titleId} className={`modal${wide ? " modal-wide" : ""}${drawer ? " modal-drawer" : ""}`} onKeyDown={keepFocusInDialog} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === ref.current) onClose(); }}>
    <div className="modal-inner">
      <header className="modal-header"><h2 id={titleId}>{title}</h2><button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose}>×</button></header>
      {children}
    </div>
  </dialog>;
}
