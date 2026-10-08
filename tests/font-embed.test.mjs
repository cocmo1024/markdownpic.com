import assert from "node:assert/strict";
import test from "node:test";
import { parseUnicodeRange, rangeCovers } from "../lib/font-embed.ts";

test("unicode-range parsing handles single points, spans and wildcards", () => {
  assert.deepEqual(parseUnicodeRange("U+4E00-9FFF, U+20, U+3??"), [[0x4e00, 0x9fff], [0x20, 0x20], [0x300, 0x3ff]]);
  assert.deepEqual(parseUnicodeRange(""), []);
});

test("only font slices containing the card's characters are embedded", () => {
  const points = text => new Set([...text].map(char => char.codePointAt(0)));
  const cjk = parseUnicodeRange("U+4E00-4FFF");
  assert.equal(rangeCovers(cjk, points("Hello")), false, "Latin text skips a CJK slice");
  assert.equal(rangeCovers(cjk, points("你好")), true);
  assert.equal(rangeCovers([], points("anything")), true, "faces without unicode-range always apply");
});
