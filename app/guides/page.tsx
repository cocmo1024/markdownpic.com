import type { Metadata } from "next";
import Link from "next/link";
import { InfoShell } from "../components/info-shell";
import { allGuides, guideGroups } from "./guides";

export const metadata: Metadata = { title: "Guides: Markdown to image", description: "Step-by-step guides for turning Markdown, AI answers, documents and spreadsheets into images: formats, sizes for each platform, tables, diagrams, math, code, carousels and batches.", alternates: { canonical: "/guides" } };

export default function Guides() {
  return <InfoShell>
    <h1>Guides</h1>
    <p>Practical walkthroughs for the things people most often turn into images. Each guide opens a matching template in the editor.</p>
    {guideGroups.map(group => <section key={group}>
      <h2>{group}</h2>
      <ul className="guide-list">{allGuides.filter(guide => guide.group === group).map(guide => <li key={guide.slug}><Link href={"/guides/" + guide.slug}>{guide.title}</Link><span>{guide.summary}</span></li>)}</ul>
    </section>)}
  </InfoShell>;
}
