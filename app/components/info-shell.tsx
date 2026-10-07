import type { ReactNode } from "react";
import Link from "next/link";
export function InfoShell({ children }: { children: ReactNode }) {
  return <div className="info-shell"><header className="info-header"><Link className="wordmark" href="/"><span className="brand-icon" aria-hidden="true">M↗P</span>MarkdownPic</Link><Link className="button-link" href="/">Open editor ↗</Link></header><main className="info-content">{children}</main><footer className="info-nav"><Link href="/">Markdown to image</Link><Link href="/help">Help</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></footer></div>;
}
