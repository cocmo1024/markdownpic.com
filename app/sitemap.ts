import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/help", "/privacy", "/terms"].map(path => ({ url: SITE_URL + (path === "/" ? "" : path) }));
}
