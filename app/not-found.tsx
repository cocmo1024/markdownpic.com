import type { Metadata } from "next";
import Link from "next/link";
import { InfoShell } from "./components/info-shell";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return <InfoShell>
    <h1>This page doesn’t exist</h1>
    <p>The address may be mistyped, or the page has moved. <Link href="/">Open the editor</Link>, or browse the <Link href="/guides">guides</Link> and <Link href="/help">help</Link>.</p>
  </InfoShell>;
}
