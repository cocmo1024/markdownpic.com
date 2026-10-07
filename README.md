# MarkdownPic

A local-first Markdown-to-image workbench, primarily for English-speaking users. Desktop opens with equal editor/preview panels. Mobile uses Edit and Preview tabs with a persistent export action.

## Current release status

Implementation and validation are local. **Core Chrome workflows, real image files and mobile-width editing/import/export/backup restoration have been verified. Physical-phone and remaining failure-path acceptance are still required.** See [QA_CHECKLIST.md](QA_CHECKLIST.md). A desktop viewport test is not proof that native sharing, soft keyboards or Safari behave correctly.

No repository push, deployment, analytics integration or ad request is performed by this project’s build commands.

## Core workflow

- Paste or type Markdown, import .md/.markdown/.mdown/.txt, or start a non-destructive template.
- Insert local PNG/JPEG/WebP files through file selection, paste or drag/drop. Short asset references keep the source readable.
- Render GFM tables/tasks, code, KaTeX math and strict-mode Mermaid diagrams.
- Choose Auto height, Square, Portrait, Story or Landscape; theme, accent, typeface, image text size, padding, optional signature/header/branding.
- Use single-image mode or up to 20 pages. Add/reorder/remove pages, retain page-specific overrides, or measure and auto-split semantic content.
- Export PNG/JPEG/WebP at 1×/2×/3×. Multi-page output is a ZIP with source.md. Preflight stops incomplete or oversized output.
- Inspect the actual resulting image, download again, open the image, share through supported device UI, copy PNG/source, or download Markdown directly without clipboard permission.
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

- lib/studio-model.ts: validated projects, page settings, sizes and accessible accent selection.
- lib/markdown-document.ts and lib/pagination.ts: syntax-aware segmentation and measured pagination.
- lib/project-store.ts and lib/local-image-store.ts: local storage and conflict control.
- lib/project-bundle.ts: portable project archives and bounded import validation.
- app/components/capture-card.tsx: the same card renderer for preview, measurement and export.
- lib/capture-engine.tsx: immutable snapshot, sequential capture, asset readiness, dimensions, cancellation, format conversion and ZIP.
- lib/capture-checks.ts: common two-axis and resource-size preflight.

## SEO and sponsorship

Public identity is https://markdownpic.com, configured in lib/site-config.ts. The tool replaced the former Astro content site and the tool.markdownpic.com subdomain in October 2026. The tool route has a canonical and truthful WebApplication structured data; help, privacy and terms are server-rendered and included in the sitemap.

There is no hidden keyword stuffing, crawler-only content, fake rating or draft indexing. The default workbench remains focused on the tool.

Sponsorship is **off** in lib/site-config.ts. The reserved help-bottom component renders nothing while disabled: no whitespace, request or tracking. It supports a clearly labeled first-party sponsor link with rel=sponsored. To activate it later, confirm the actual sponsor/copy/URL and then test the layout. Do not place scripts inside the editor or capture component. An ad network, personalized advertising, analytics or payments require a separate consent/privacy/security review and explicit authorization.

## Deployment

The build emits a Cloudflare Worker entry at dist/server/index.js and public assets at dist/client. Do not deploy only an SPA index.html or expose server intermediates as public files. The packaged Sites manifest declares no D1 or R2 resources. No IMAGES binding or server image proxy is required; image conversion is on-device.

Production runs on the Cloudflare Worker named `markdownpic` (custom domain markdownpic.com). Pushing to main triggers Cloudflare Workers Builds (`npm run build`, then `npx wrangler deploy`, which follows the generated .wrangler/deploy redirect to dist/server/wrangler.json). A deployment platform configuration, repository credentials, Search Console verification and commercial operator/contact disclosures must be supplied or confirmed by the operator; do not fabricate them.

After all browser gates pass and the owner authorizes release: push the reviewed source, deploy the validated build, wait for terminal platform success, then verify the real public routes and an actual exported image over HTTPS. Update the status file with evidence. Do not infer production success from a local build or a queued deploy.
