import assert from "node:assert/strict";
import test from "node:test";
import { highlightMarkdown } from "../lib/markdown-highlight.ts";

// The mirror must render exactly the textarea's characters, or the caret drifts.
const plain = html => html.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

const samples = [
  "# Title\n\nSome **bold**, *em*, _em_, `code`, [link](https://example.com) and ![img](asset:img-1).",
  "> quote with **strong**\n>> nested\n\n- item\n  - nested item\n1. one\n2) two\n- [x] done\n- [ ] todo",
  "~~~js\nconst a = 1 < 2 && b > 3; // **not bold**\n~~~\n\n```\nunclosed fence\n# not a heading",
  "| A | B |\n| :-- | --: |\n| `x` | **y** |\n\n---\n***\n\n$$E = mc^2$$\n\nInline $a^2$ math.",
  "<!-- page -->\n<script>alert(1)</script> & &amp; &lt;\n\n#hashtag  \n\ttab\n\n\n",
  "",
];

test("highlighting preserves every character of the source", () => {
  for (const source of samples) assert.equal(plain(highlightMarkdown(source)), source);
});

test("highlighting escapes markup instead of rendering it", () => {
  const html = highlightMarkdown("<img src=x onerror=alert(1)>");
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;img/);
});

test("structural tokens receive their classes", () => {
  const html = highlightMarkdown("# Heading\n**bold**\n<!-- page -->\n~~~\ncode\n~~~");
  assert.match(html, /md-h1/);
  assert.match(html, /md-strong">bold</);
  assert.match(html, /md-page/);
  assert.match(html, /md-pre">code</);
});
