# MarkdownPic

A local-first Markdown-to-image workbench, primarily for English-speaking users. Desktop opens with equal editor/preview panels. Mobile uses Edit and Preview tabs with a persistent export action.

## Current release status

Implementation and validation are local. **Core Chrome workflows, real image files and mobile-width editing/import/export/backup restoration have been verified. Physical-phone and remaining failure-path acceptance are still required.** See [QA_CHECKLIST.md](QA_CHECKLIST.md). A desktop viewport test is not proof that native sharing, soft keyboards or Safari behave correctly.

Build commands never push or deploy. Pushing to main deploys through Cloudflare Workers Builds.

## Core workflow

- Paste or type Markdown, import .md/.markdown/.mdown/.txt, or start a non-destructive template.
- Insert local PNG/JPEG/WebP files through file selection, paste or drag/drop. Short asset references keep the source readable.
- Render GFM tables/tasks, code, KaTeX math and strict-mode Mermaid diagrams.
- Choose Auto height, Square, Portrait, Story or Landscape; theme, accent, typeface, image text size, padding, optional signature/header/branding.
- Use single-image mode or up to 20 pages. Add/reorder/remove pages, retain page-specific overrides, or measure and auto-split semantic content.
- Export PNG/JPEG/WebP at 1×/2×/3×. Multi-page output is a ZIP with source.md. Preflight stops incomplete or oversized output.
- Inspect the actual resulting image, download again, open the image, share through supported device UI, copy PNG/source, or download Markdown directly without clipboard permission.
- Paste rich text from web pages, Notion or Docs and it arrives as Markdown (lib/smart-paste.ts); Ctrl/⌘ Shift V pastes plain text.
- My brand (lib/brand-kit.ts): avatar, name, handle and a brand style, stored in this browser only and rendered as a byline (top, bottom or hidden per project) on every image. Never included in share links or backups.
- New projects inherit the last style used. Fit text sizes a card’s text to its canvas.
- Copy editable link: the draft is compressed into the URL fragment (lib/share-link.ts), never uploaded; local images are excluded.
- Installable PWA with offline support (public/manifest.webmanifest, public/sw.js: network-first pages, cache-first hashed assets, third-party requests untouched).
- Save multiple browser-local projects, undo/redo during a session, recover older drafts, and avoid stale-tab overwrites.
- Back up complete .mdpic projects with Markdown, styles and local image assets; restore as a new project. Save reusable styles locally.

## Storage and limits

This is deliberately device-local, not a cloud account product. Drafts and images live in IndexedDB. The old draft record is preserved when migrated. Browser data eviction, private browsing, clearing site data or losing a device can remove work.

Use .mdpic backups for portability. Plain Markdown contains local asset references, not image bytes. Export ZIP source.md is a text companion, not a complete editable asset backup. Remote images are not bundled as local files and must permit CORS for browser export. Markdown-relative file paths do not automatically import adjacent files.

Limits: 120,000 source characters per project; 20 pages; 12 MB and 32 megapixels per imported image; 64 MB of bundled image assets; maximum exported edge 16,384px, 24 million pixels per image and 80 million pixels per batch. These are guards, not a promise that all devices can render up to the limit. Lower resolution or smaller batches are recommended on memory-constrained phones.

Deleted projects do not delete shared image bytes automatically. Clear this site's browser data to remove all local assets, after backing up important work.

## Development

Node.js 22.13 or later; Node 24 is used for the TypeScript-aware unit test runner.

~~~sh
npm ci
npm run dev
~~~

Open the exact local address printed by the server. A localhost URL is accessible on that computer, not automatically on a phone. For a private physical-device test, use an explicitly configured trusted test environment with HTTPS; do not expose user drafts or open firewall rules casually.

## Validation

~~~sh
npm run lint
npm run typecheck
npm test
npm audit
~~~

- test:unit exercises parsing, pagination contracts, settings/contrast, export preflight, IndexedDB storage using fake-indexeddb, conflicts, legacy migration and bundle serialization/validation.
- test:render calls the built Worker and checks public HTML, route status, canonical identity, structured data, sitemap, robots, security headers and default-off sponsorship.
- These automated checks do **not** run a browser or inspect a real exported raster file. Follow QA_CHECKLIST.md for that gate.
- Mermaid is dynamically loaded. The build can report a large optional diagram chunk; test first-use diagram performance on target phones.

## Architecture

The application uses React/TypeScript and vinext on Vite. The UI is split into focused components; shared output styling is independent from editor UI fonts.

- lib/markdown-highlight.ts and lib/markdown-edits.ts: the editor’s syntax tinting (cached per line) and structured edits (list continuation, indent, wrap, paste-as-link).
- lib/studio-model.ts: validated projects, page settings, sizes and accessible accent selection.
- lib/markdown-document.ts and lib/pagination.ts: syntax-aware segmentation and measured pagination.
- lib/project-store.ts and lib/local-image-store.ts: local storage and conflict control.
- lib/project-bundle.ts: portable project archives and bounded import validation.
- app/components/capture-card.tsx: the same card renderer for preview, measurement and export.
- lib/capture-engine.tsx: immutable snapshot, sequential capture, asset readiness, dimensions, cancellation, format conversion and ZIP.
- lib/capture-checks.ts: common two-axis and resource-size preflight.

## SEO and advertising

Public identity is https://markdownpic.com, configured in lib/site-config.ts. The tool replaced the former Astro content site and the tool.markdownpic.com subdomain (now a 301 to the root) in October 2026. The homepage is the tool only, with a canonical and truthful WebApplication structured data. Task guides live at /guides (app/guides/guides.tsx): real walkthroughs of tool features, each opening a template via /?template=<id>, reachable from the Help menu, help page, footer and sitemap. lib/legacy-redirects.ts 301s only those retired reference-site URLs whose topic matches a current page; the rest stay 404. Help, privacy and terms are server-rendered and in the sitemap. No hidden keyword stuffing, crawler-only content or fake ratings.

Google AdSense (`adsense` in lib/site-config.ts) runs in reserved, labelled slots only: one fixed rail beside the workbench (160px wide at ≥1280px, 300px at ≥1600px) and in-content units on the help page. `app/components/ad-slot.tsx` injects the loader after hydration once the browser is idle, requests a unit only when its media query matches, and shows a tips card when AdSense reports no fill. Ads never enter the editor or the capture card. On localhost the slots render dashed placeholders without any request. public/ads.txt authorizes the publisher; EEA/UK/CH consent is served by Google's CMP configured in AdSense. AdSense Auto ads are configured per site in the AdSense dashboard, not in code.

## Deployment

The build emits a Cloudflare Worker entry at dist/server/index.js and public assets at dist/client. Do not deploy only an SPA index.html or expose server intermediates as public files. The packaged Sites manifest declares no D1 or R2 resources. No IMAGES binding or server image proxy is required; image conversion is on-device.

Production runs on the Cloudflare Worker named `markdownpic` (custom domain markdownpic.com). Pushing to main triggers Cloudflare Workers Builds (`npm run build`, then `npx wrangler deploy`, which follows the generated .wrangler/deploy redirect to dist/server/wrangler.json). A deployment platform configuration, repository credentials, Search Console verification and commercial operator/contact disclosures must be supplied or confirmed by the operator; do not fabricate them.

After all browser gates pass and the owner authorizes release: push the reviewed source, deploy the validated build, wait for terminal platform success, then verify the real public routes and an actual exported image over HTTPS. Update the status file with evidence. Do not infer production success from a local build or a queued deploy.
