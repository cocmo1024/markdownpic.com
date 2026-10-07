import Workbench from "./components/workbench";
import type { Metadata } from "next";
import { SITE_URL, siteDescription } from "@/lib/site-config";

export const metadata: Metadata = { alternates: { canonical: "/" }, openGraph: { url: SITE_URL, title: "Markdown to Image | MarkdownPic", description: siteDescription, type: "website" } };
const structuredData = { "@context": "https://schema.org", "@type": "WebApplication", name: "MarkdownPic", url: SITE_URL, description: siteDescription, applicationCategory: "DesignApplication", operatingSystem: "Web browser", inLanguage: "en", browserRequirements: "JavaScript, IndexedDB, Canvas", isAccessibleForFree: true };

export default function Home() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /><Workbench /></>;
}
