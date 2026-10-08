import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InfoShell } from "../../components/info-shell";
import { AdSlot } from "../../components/ad-slot";
import { Icon } from "../../components/icons";
import { allGuides, guideFor } from "../guides";
import { SITE_URL } from "@/lib/site-config";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allGuides.map(guide => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = guideFor((await params).slug);
  if (!guide) return {};
  return { title: guide.title, description: guide.description, alternates: { canonical: "/guides/" + guide.slug }, openGraph: { title: guide.title, description: guide.description, url: SITE_URL + "/guides/" + guide.slug, type: "article" } };
}

export default async function GuidePage({ params }: Props) {
  const guide = guideFor((await params).slug);
  if (!guide) notFound();
  const others = allGuides.filter(item => item.slug !== guide.slug);
  const related = [...others.filter(item => item.group === guide.group), ...others.filter(item => item.group !== guide.group)].slice(0, 4);
  return <InfoShell>
    <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/guides">Guides</Link></nav>
    <h1>{guide.title}</h1>
    {guide.body}
    <p className="guide-cta"><Link className="button-link primary-button" href={"/?template=" + guide.template}>Try it with this template<Icon name="arrow" /></Link></p>
    <AdSlot slot="inline" />
    <h2>More guides</h2>
    <ul className="guide-list">{related.map(item => <li key={item.slug}><Link href={"/guides/" + item.slug}>{item.title}</Link><span>{item.summary}</span></li>)}</ul>
  </InfoShell>;
}
