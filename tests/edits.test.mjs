import assert from "node:assert/strict";
import test from "node:test";
import { continueBlock, indentLines, linkOnPaste, wrapSelection } from "../lib/markdown-edits.ts";

const at = (value, start = value.length, end = start) => ({ value, start, end });

test("Enter continues bullets, numbers, tasks and quotes", () => {
  assert.deepEqual(continueBlock("- one", 5, 5), at("- one\n- "));
  assert.deepEqual(continueBlock("  * nested", 10, 10), at("  * nested\n  * "));
  assert.deepEqual(continueBlock("9. nine", 7, 7), at("9. nine\n10. "));
  assert.deepEqual(continueBlock("1) one", 6, 6), at("1) one\n2) "));
  assert.deepEqual(continueBlock("- [x] done", 10, 10), at("- [x] done\n- [ ] "));
  assert.deepEqual(continueBlock("> quote", 7, 7), at("> quote\n> "));
});

test("Enter on an empty item ends the list without touching other lines", () => {
  assert.deepEqual(continueBlock("- one\n- ", 8, 8), { value: "- one\n", start: 6, end: 6 });
  assert.deepEqual(continueBlock("- one\n- \nafter", 8, 8), { value: "- one\n\nafter", start: 6, end: 6 });
});

test("Enter falls back to the browser where continuing would be wrong", () => {
  assert.equal(continueBlock("plain text", 10, 10), null);
  assert.equal(continueBlock("- one", 2, 2), null, "caret inside the item");
  assert.equal(continueBlock("- one", 0, 5), null, "selection");
  assert.equal(continueBlock("~~~\n- not a list", 16, 16), null, "inside a code fence");
});

test("Tab indents list items and selected lines; Shift+Tab outdents", () => {
  assert.deepEqual(indentLines("- one", 5, 5, false), { value: "  - one", start: 7, end: 7 });
  assert.deepEqual(indentLines("  - one", 7, 7, true), { value: "- one", start: 5, end: 5 });
  assert.deepEqual(indentLines("a\nb", 0, 3, false), { value: "  a\n  b", start: 2, end: 7 });
  assert.equal(indentLines("plain", 2, 2, false), null, "single plain line keeps native Tab focus movement");
  assert.equal(indentLines("- flush", 3, 3, true), null, "nothing to outdent");
});

test("wrapping toggles markers around the selection", () => {
  assert.deepEqual(wrapSelection("make bold", 5, 9, "**", "**", "bold text"), { value: "make **bold**", start: 7, end: 11 });
  assert.deepEqual(wrapSelection("make **bold**", 7, 11, "**", "**", "bold text"), { value: "make bold", start: 5, end: 9 });
  assert.deepEqual(wrapSelection("", 0, 0, "*", "*", "italic"), { value: "*italic*", start: 1, end: 7 });
});

test("pasting a URL over selected words creates a link", () => {
  assert.deepEqual(linkOnPaste("read the docs", 9, 13, "https://example.com/a "), at("read the [docs](https://example.com/a)"));
  assert.equal(linkOnPaste("read the docs", 13, 13, "https://example.com"), null, "no selection");
  assert.equal(linkOnPaste("read the docs", 9, 13, "not a url"), null);
});
