import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { templateCategories, templateDesign, templates } from "../lib/templates.ts";
import { canvasPresets, defaultDesign, FONT_SCALE_MAX, FONT_SCALE_MIN, normalizeDesign, themes } from "../lib/studio-model.ts";

test("template library: unique ids, valid themes and sizes, every category used", () => {
  assert.equal(new Set(templates.map(item => item.id)).size, templates.length);
  for (const template of templates) {
    assert.ok(themes.some(theme => theme.id === template.theme), template.id + " theme");
    assert.ok(canvasPresets.some(preset => preset.id === template.size), template.id + " size");
    assert.ok(templateCategories.some(category => category.id === template.category), template.id + " category");
    const design = templateDesign(defaultDesign, template);
    assert.deepEqual(normalizeDesign(design), design, template.id + " design survives normalization");
    assert.ok(design.fontScale >= FONT_SCALE_MIN && design.fontScale <= FONT_SCALE_MAX);
  }
  for (const category of templateCategories) assert.ok(templates.some(item => item.category === category.id), category.id + " has templates");
});

test("every template a guide links to exists", () => {
  const source = readFileSync(new URL("../app/guides/guides.tsx", import.meta.url), "utf8") + readFileSync(new URL("../app/guides/more-guides.tsx", import.meta.url), "utf8");
  for (const [, id] of source.matchAll(/template: "([a-z-]+)"/g)) assert.ok(templates.some(item => item.id === id), "guide template " + id);
});
