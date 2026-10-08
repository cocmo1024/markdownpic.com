import test from "node:test";
import assert from "node:assert/strict";
import { escapeCurrency, latexForKatex, normalizeMathDelimiters } from "../lib/render-markdown.ts";

test("prices stay text; real inline math stays math", () => {
  assert.equal(escapeCurrency("It costs $5 and $10 today."), "It costs \\$5 and \\$10 today.");
  assert.equal(escapeCurrency("Only $20."), "Only \\$20.");
  assert.equal(escapeCurrency("Energy $E=mc^2$ here."), "Energy $E=mc^2$ here.");
  assert.equal(escapeCurrency("$a$ and $b$"), "$a$ and $b$");
  assert.equal(escapeCurrency("Costs $5, while $x+1$ is math"), "Costs \\$5, while $x+1$ is math");
  assert.equal(escapeCurrency("From $5 to $10"), "From \\$5 to \\$10");
  assert.equal(escapeCurrency("Already escaped \\$5"), "Already escaped \\$5");
  assert.equal(escapeCurrency("$$\nx = $y$\n$$"), "$$\nx = $y$\n$$", "display math is untouched");
  assert.equal(escapeCurrency("A lone $ sign"), "A lone \\$ sign");
});

test("LaTeX that KaTeX rejects is translated, not shown as an error", () => {
  assert.equal(latexForKatex("E = mc^2 \\label{eq:energy}"), "E = mc^2 ");
  assert.equal(latexForKatex("\\newcommand{\\R}{\\mathbb{R}}"), "\\gdef\\R{\\mathbb{R}}");
  assert.equal(latexForKatex("\\newcommand{\\abs}[1]{\\left|#1\\right|}"), "\\gdef\\abs#1{\\left|#1\\right|}");
  assert.equal(latexForKatex("\\renewcommand\\vec[2]{(#1,#2)}"), "\\gdef\\vec#1#2{(#1,#2)}");
  assert.equal(latexForKatex("\\DeclareMathOperator{\\Tr}{Tr}"), "\\gdef\\Tr{\\operatorname{Tr}}");
  assert.equal(latexForKatex("\\DeclareMathOperator*{\\argmax}{arg\\,max}"), "\\gdef\\argmax{\\operatorname*{arg\\,max}}");
  assert.equal(latexForKatex("plain text"), "plain text");
});

test("code is never rewritten", () => {
  assert.equal(normalizeMathDelimiters("Price `$5` and\n\n```\n$10 \\label{x}\n```"), "Price `$5` and\n\n```\n$10 \\label{x}\n```");
});
