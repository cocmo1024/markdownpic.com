import type { Metadata } from "next";
import Link from "next/link";
import { InfoShell } from "../components/info-shell";
import { guides } from "./guides";

export const metadata: Metadata = { title: "Guides: Markdown to image", description: "Step-by-step guides for turning Markdown into images: long images, tables, Mermaid diagrams, LaTeX math, code snippets and carousels.", alternates: { canonical: "/guides" } };

export default function Guides() {
  return <InfoShell>
    <h1>Guides</h1>
    <p>Practical walkthroughs for the things people most often turn into images. Each guide opens a matching template in the editor.</p>
    <ul className="guide-list">{guides.map(guide => <li key={guide.slug}><Link href={"/guides/" + guide.slug}>{guide.title}</Link><span>{guide.summary}</span></li>)}</ul>
  </InfoShell>;
}
