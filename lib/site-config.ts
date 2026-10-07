export const SITE_URL = "https://markdownpic.com";
export const siteDescription = "Turn Markdown into PNG, JPEG, or WebP images in your browser. Create readable cards and multi-page carousels with local images, math, and diagrams. No account required.";

/** Default-off, first-party sponsorship only. No ad network or tracking script. */
export const sponsorship: { enabled: boolean; placements: Array<"help-bottom">; label: string; title: string; url: string } = {
  enabled: false,
  placements: ["help-bottom"],
  label: "Sponsored",
  title: "",
  url: "",
};
