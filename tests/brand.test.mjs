import assert from "node:assert/strict";
import test from "node:test";
import { emptyBrand, hasBrand, normalizeBrand } from "../lib/brand-kit.ts";
import { defaultDesign, normalizeDesign } from "../lib/studio-model.ts";

test("a brand kit is set up once it says who the image is from", () => {
  assert.equal(hasBrand(null), false);
  assert.equal(hasBrand(emptyBrand), false);
  assert.equal(hasBrand({ ...emptyBrand, name: "  " }), false);
  assert.equal(hasBrand({ ...emptyBrand, name: "Ada" }), true);
  assert.equal(hasBrand({ ...emptyBrand, avatar: "data:image/png;base64,AAAA" }), true);
});

test("brand input is cleaned: handles, avatars, colors and limits", () => {
  assert.equal(normalizeBrand({ handle: "ada" }).handle, "@ada");
  assert.equal(normalizeBrand({ handle: "@ada" }).handle, "@ada");
  assert.equal(normalizeBrand({ handle: "ada.dev" }).handle, "ada.dev", "domains stay as typed");
  assert.equal(normalizeBrand({ name: "Ada\nLovelace\t" }).name, "Ada Lovelace");
  assert.equal(normalizeBrand({ name: "x".repeat(200) }).name.length, 60);
  assert.equal(normalizeBrand({ avatar: "https://tracker.example/pixel.png" }).avatar, "", "remote avatars are refused");
  assert.equal(normalizeBrand({ avatar: "data:image/svg+xml;base64,PHN2Zz4=" }).avatar, "", "SVG avatars are refused");
  assert.equal(normalizeBrand({ avatar: "data:image/png;base64," + "A".repeat(300_000) }).avatar, "", "oversized avatars are refused");
  assert.equal(normalizeBrand({ accent: "red", theme: "neon", font: "comic" }).accent, emptyBrand.accent);
  assert.equal(normalizeBrand({ theme: "ink", font: "serif" }).theme, "ink");
});

test("designs default to a bottom byline and reject unknown positions", () => {
  assert.equal(defaultDesign.byline, "bottom");
  assert.equal(normalizeDesign({ byline: "top" }).byline, "top");
  assert.equal(normalizeDesign({ byline: "sideways" }).byline, "bottom");
  assert.equal(normalizeDesign({}).byline, "bottom", "older projects gain the byline once a brand exists");
});
