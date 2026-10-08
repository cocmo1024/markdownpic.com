import assert from "node:assert/strict";
import test from "node:test";
import { fillTemplate, MAX_BATCH_ROWS, parseTable, placeholdersIn, planBatch } from "../lib/batch.ts";

test("tables parse from spreadsheet pastes and CSV, with quoting", () => {
  assert.deepEqual(parseTable("name\tquote\nAda\tCode is poetry\n"), [["name", "quote"], ["Ada", "Code is poetry"]]);
  assert.deepEqual(parseTable("a,b\n\"x, y\",\"say \"\"hi\"\"\"\n"), [["a", "b"], ["x, y", "say \"hi\""]]);
  assert.deepEqual(parseTable("a;b\r\n1;2"), [["a", "b"], ["1", "2"]]);
  assert.deepEqual(parseTable("﻿title\n\"two\nlines\"\n\n"), [["title"], ["two\nlines"]], "BOM, quoted newlines, blank lines");
});

test("headers are detected from placeholders; rows fill the template", () => {
  const template = "# {{Title}}\n\n{{ body }}\n\n— {{n}}/{{total}}";
  assert.deepEqual(placeholdersIn(template), ["Title", "body", "n", "total"]);
  const plan = planBatch(parseTable("title,body\nFirst,One\nSecond,Two"), template);
  assert.equal(plan.usesHeader, true); assert.equal(plan.records.length, 2); assert.deepEqual(plan.missing, []);
  assert.equal(fillTemplate(template, plan.records[1], 1, 2), "# Second\n\nTwo\n\n— 2/2");
});

test("without placeholders, each row becomes the content; limits and gaps are reported", () => {
  const plan = planBatch(parseTable("Stay curious.\nShip small."), "# Ignored template");
  assert.equal(plan.usesHeader, false);
  assert.equal(fillTemplate("# Ignored template", plan.records[0], 0, 2), "Stay curious.");
  const gaps = planBatch(parseTable("title\nA"), "{{title}} {{author}}");
  assert.deepEqual(gaps.missing, ["author"]);
  const many = planBatch(parseTable(Array.from({ length: MAX_BATCH_ROWS + 5 }, (_, i) => "row " + i).join("\n")), "x");
  assert.equal(many.records.length, MAX_BATCH_ROWS); assert.equal(many.truncated, true);
});
