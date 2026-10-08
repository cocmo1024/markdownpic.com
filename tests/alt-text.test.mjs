import assert from "node:assert/strict";
import test from "node:test";
import { ALT_TEXT_LIMIT, markdownToAltText } from "../lib/alt-text.ts";

test("alt text reads like the image, without Markdown syntax", () => {
  const alt = markdownToAltText("# Small changes\n\nThey **compound** over [time](https://x.y).\n\n- One\n- [x] Two\n\n> A quote\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\n![Chart of growth](asset:img-1)\n\n```js\nconst a = 1;\n```\n\n```mermaid\nflowchart TD\nA-->B\n```\n\n<!-- page -->\n\nInline $x^2$ math.");
  assert.equal(alt, "Small changes\nThey compound over time.\nOne Two\nA quote\nA, B 1, 2\nImage: Chart of growth.\nCode (js): const a = 1;\nDiagram.\nInline x^2 math.");
});

test("alt text stays within the 1,000-character limit on a word boundary", () => {
  const alt = markdownToAltText("word ".repeat(400));
  assert.ok(alt.length <= ALT_TEXT_LIMIT);
  assert.ok(alt.endsWith("word…"));
});
