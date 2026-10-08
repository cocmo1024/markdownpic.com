import assert from "node:assert/strict";
import test from "node:test";
import { decodeShare, encodeShare, SHARE_PREFIX } from "../lib/share-link.ts";
import { newPage, newProject } from "../lib/studio-model.ts";

test("a shared draft round-trips text, pages and styles into a new project", () => {
  const project = newProject("# Hello\n\nWorld — 你好 ✓", "My card");
  project.design = { ...project.design, theme: "ink", fontFamily: "serif", presetId: "square" };
  project.pages.push(newPage("## Second", { theme: "rose" }));
  project.mode = "carousel";
  const { fragment, tooLong, localImages } = encodeShare(project);
  assert.ok(fragment.startsWith(SHARE_PREFIX)); assert.equal(tooLong, false); assert.equal(localImages, false);
  assert.match(fragment.slice(3), /^[A-Za-z0-9_-]+$/, "URL-safe");
  const opened = decodeShare(fragment);
  assert.notEqual(opened.id, project.id, "always a new project");
  assert.equal(opened.name, "My card"); assert.equal(opened.mode, "carousel");
  assert.deepEqual(opened.pages.map(page => page.markdown), ["# Hello\n\nWorld — 你好 ✓", "## Second"]);
  assert.equal(opened.design.theme, "ink"); assert.equal(opened.pages[1].design.theme, "rose");
});

test("links flag local images and reject damaged or hostile payloads", () => {
  assert.equal(encodeShare(newProject("![x](asset:img-1)")).localImages, true);
  assert.throws(() => decodeShare("#s=not-really-data"), /damaged|valid/);
  assert.throws(() => decodeShare("#x=abc"), /not valid/);
  const evil = newProject("text"); evil.design = { ...evil.design, accent: "url(javascript:alert(1))", padding: 9999 };
  const opened = decodeShare(encodeShare(evil).fragment);
  assert.match(opened.design.accent, /^#[0-9a-f]{6}$/i); assert.ok(opened.design.padding <= 80, "designs are normalized");
});
