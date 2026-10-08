import assert from "node:assert/strict";
import test from "node:test";
import { hasMath, normalizeMathDelimiters, smartenText } from "../lib/render-markdown.ts";

test("AI-style math delimiters become renderer math, outside code only", () => {
  assert.equal(normalizeMathDelimiters("Energy \\(E = mc^2\\) here."), "Energy $E = mc^2$ here.");
  assert.equal(normalizeMathDelimiters("Before\n\\[\n\\int_0^1 x\\,dx\n\\]\nAfter"), "Before\n\n$$\n\\int_0^1 x\\,dx\n$$\n\nAfter");
  assert.equal(normalizeMathDelimiters("Code `\\(x\\)` stays"), "Code `\\(x\\)` stays");
  assert.equal(normalizeMathDelimiters("```\n\\(x\\)\n```\n"), "```\n\\(x\\)\n```\n");
  assert.equal(normalizeMathDelimiters("No math at all"), "No math at all");
  assert.ok(hasMath("\\(a\\)")); assert.ok(hasMath("$a$")); assert.ok(!hasMath("plain"));
});

test("smart typography: quotes, apostrophes, dashes and ellipses", () => {
  assert.equal(smartenText("\"Hello,\" she said."), "“Hello,” she said.");
  assert.equal(smartenText("It's Ada's 'idea'."), "It’s Ada’s ‘idea’.");
  assert.equal(smartenText("Wait... pages 1--5 --- done"), "Wait… pages 1–5 — done");
  assert.equal(smartenText("rock 'n' roll in the '90s"), "rock ‘n’ roll in the ’90s");
  assert.equal(smartenText("\" after bold", "d"), "” after bold", "context carries across formatting");
});
