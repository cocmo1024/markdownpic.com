# Browser acceptance — required before calling this release ready

Status: **main Chrome journey and actual exported artifacts exercised on 2026-09-13**. Detailed browser QA records are kept outside the repository. This remains the complete acceptance matrix, not a claim that every case below passed. Physical phones, clipboard paste/share and browser fault-injection cases remain open.

Additional confirmed cases: two-window conflict/copy/reload; invalid Mermaid recovery without orphan SVGs; missing-image selection replacement; ordinary eight-page cancel/retry; simulated quota-style write failure with unsaved-source backup/export and Retry save/reload; true CORS refusal; query-sensitive images; cancellation during confirmed font, slow-image and encoding waits. First-load denied storage, actual quota exhaustion and physical-device/lifecycle acceptance remain pending. See the evidence report for precise limits.

Page/style continuation also confirms inheritance/reorder/reset/Undo, narrow-screen add/move/remove, style-preserving backup restore, byte-identical exports at Fit/100% preview, unbreakable formula failure preservation, modal boundary/focus-return fixes and reduced motion. Preview zoom is not 200% browser text enlargement; physical devices and full accessibility acceptance remain separate.

Finishing continuation confirms reusable-style persistence/reapplication, a complete signed real PNG, controlled clipboard-denial guidance and direct Save Markdown download at 320px, plus unsafe-path/unsupported-manifest/expanded-size archive rejection without replacing the current draft. Native permission changes and physical paste/share are not represented by runtime rejection tests.

Use the existing local preview at http://localhost:3000/. Do not delete or overwrite the user's existing drafts. Create separate QA projects. Keep original local storage and legacy records.

## Viewports and accessibility

- Chrome desktop: 1440×900 and 1920×1080; verify readable 14–16px UI labels, editor text size, 50/50 initial split, resize handle and no page-level horizontal overflow.
- Chrome mobile emulation: 390×844, 360×800 and 320×740; test the full flow below, not just a screenshot.
- Narrow landscape and 200% browser/text zoom: controls remain reachable without overlap.
- Tab through header, editor tools, mobile view tabs, Customize, page controls and export. Left/right changes mobile tabs. Escape closes dialogs and focus returns to the triggering control.
- Test reduced-motion preference. No continuous decorative animation.
- A physical iOS Safari and Android Chrome check remains necessary before claiming both platforms are supported: soft keyboard, file picker, Save/Open image, native Share and ZIP handling are platform behaviors that desktop emulation cannot prove.

## First-use and recovery

1. Verify old drafts migrate without losing source or local images. Preserve the legacy key.
2. Open My projects; create a new project, type text, undo/redo, rename and reload.
   - With a deliberately delayed local write in a disposable test profile, undo while saving. Reload must show the visible, undone version, not the intermediate write.
3. Import a Markdown file and select a template. Confirm the preceding project is still available.
4. Open the same project in two tabs. Change and save in tab A, then edit in tab B. Confirm conflict handling, latest-version reopening, and Save a copy.
5. Simulate denied/full storage in a separate disposable browser profile. Confirm the export/backup path works and save failure is not falsely reported as success.
6. Delete only a QA project after verifying its backup; confirm other projects remain.

## Images and rich content

1. Insert a permitted local PNG, JPEG and WebP using file selection, paste and drag/drop. Confirm short asset references, selection replacement and no Base64 editor wall.
2. Insert a selected image while a source range is selected; confirm the image replaces that range.
3. Test unsupported types, an oversized image, a missing local asset and a remote CORS failure. Error messages must be actionable; export must not silently omit the image.
   - Test two permitted remote image URLs that differ only in query parameters. Their exported content must remain distinct.
4. Open tests/fixtures/mixed-content.md. Verify headings, lists, task boxes, table borders, code, Chinese text, formula and diagram.
5. Test invalid Mermaid syntax with tests/fixtures/broken-assets.md. Correct it and verify recovery. Ensure neither failed preview nor failed export leaves Mermaid's own error SVG/document outside the workbench.

## Pagination and layout

1. Use single mode, Pages, Add page, reorder and Remove page; verify source and page-specific styles follow the correct page.
2. Open carousel-and-empty-page.md; it must have exactly three pages, with page 2 empty.
3. Auto split long text, lists and tables; review each real preview, repeated table headers, heading placement and absence of missing or duplicated wording.
4. Try an oversized unsplittable formula/diagram/code block; original source and layout must survive failure.
5. Set a page-only theme/padding; change the project default, reset the override and undo.
6. Check all themes and accents, output font families/sizes, padding, header/brand, signature positions and opacity.

## Actual exported artifacts — do not skip

1. Export mixed-content.md in Auto height. Open the downloaded PNG independently and compare with the preview, including the **BOTTOM SENTINEL**, dimensions and all rich content.
2. Test Square 1080×1080, Portrait 1080×1350, Story 1080×1920 and Landscape 1200×630 at 2×, plus 1×/3× dimensions.
3. With a too-small canvas, ensure export stops before downloading a cropped file. Verify Auto height resolves it.
4. Export PNG, JPEG and WebP. Inspect actual MIME, dimensions, complete bottom edge, padding and background; filenames must match the chosen format.
5. Export several pages as ZIP; inspect every image, page order and source.md. An empty or broken middle page must produce no partial-success download.
6. Change preview zoom between Fit and 100%, then export. Pixel dimensions and composition must remain identical.
7. Cancel a batch export. Source remains unchanged, temporary capture surface is removed, and a later export succeeds.
   - Repeat cancellation while waiting for fonts, a slow remote image, and image encoding. A stalled operation must show a timeout/recovery message rather than keep the editor locked forever.
8. Verify actual-file result preview, Download again, Open image, Copy PNG, Copy source and Save Markdown. Test denied clipboard permissions; the source-download fallback must remain available.
9. On supported physical phones, invoke Share image directly from the result button. If unsupported, verify visible Download/Open fallback.

## Portable backup

1. Create a multi-page project with local images and page-only styles.
2. Download .mdpic. Restore on a separate browser/device without access to the original IndexedDB.
3. Verify all content, local images and style overrides. Export the restored project.
4. Confirm a malformed/oversized/unsafe archive does not replace current work.

## SEO, sponsorship and release boundary

- Confirm /, /help, /privacy, /terms, /robots.txt and /sitemap.xml on the actual production hostname after authorized release.
- Search engines and users get the same public content. Drafts stay out of server HTML and sitemap.
- Sponsorship is off: no reserved blank block, tracking script or outgoing ad request.
- When sponsorship is explicitly enabled, verify its label, sponsored link relation, layout stability and exclusion from capture.
- Obtain authorization before any repository push, deployment, domain change, analytics or ad-network integration.
