import type { ReactNode } from "react";
import Link from "next/link";
import { BrandMark, Icon } from "./icons";

export function InfoShell({ children }: { children: ReactNode }) {
  return <div className="info-shell">
    <header className="info-header"><Link className="wordmark" href="/"><BrandMark size={30} /><span>Markdown<em>Pic</em></span></Link><Link className="button-link primary-button" href="/">Open editor<Icon name="arrow" /></Link></header>
    <main className="info-content">{children}</main>
    <SiteFooter />
  </div>;
}

export function SiteFooter() {
  return <footer className="site-footer"><div className="site-footer-brand"><BrandMark size={26} /><p>Markdown in, a beautiful image out. Made in your browser.</p></div><nav aria-label="Site"><Link href="/">Markdown to image</Link><Link href="/guides">Guides</Link><Link href="/help">Help</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav></footer>;
}
