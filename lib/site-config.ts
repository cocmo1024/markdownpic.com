export const SITE_URL = "https://markdownpic.com";
export const siteDescription = "Turn Markdown into PNG, JPEG, or WebP images in your browser. Create readable cards and multi-page carousels with local images, math, and diagrams. No account required.";

/**
 * Google AdSense. Units render only in their reserved slots, never inside the editor or the
 * exported image. Consent for EEA/UK/CH visitors is served by Google's certified CMP
 * (configured in AdSense › Privacy & messaging).
 */
export const adsense = {
  enabled: true,
  client: "ca-pub-6017297149672924",
  slots: {
    /** Desktop rail beside the workbench. */
    rail: "9915130728",
    /** In-content units on the homepage guide and help page. */
    inline: "6204784726",
  },
} as const;
