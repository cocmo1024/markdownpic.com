import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";
import { guides } from "./guides/guides";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/guides", ...guides.map(guide => "/guides/" + guide.slug), "/help", "/privacy", "/terms"].map(path => ({ url: SITE_URL + (path === "/" ? "" : path) }));
}
