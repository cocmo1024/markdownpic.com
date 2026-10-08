import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { exactFontSize } from "../tools/exact-font-size.ts";

const require = createRequire(import.meta.url);
const root = require.resolve("html-to-image/package.json").replace(/package\.json$/, "");

test("exports keep exact font sizes: html-to-image's rewrite is removed from both builds", () => {
  const plugin = exactFontSize();
  for (const build of ["es", "lib"]) {
    const id = root + build + "/clone-node.js";
    const source = readFileSync(id, "utf8");
    assert.match(source, /reducedFont/, build + " build still contains the rewrite this plugin targets");
    const errors = [];
    const result = plugin.transform.call({ error: message => { errors.push(message); throw new Error(message); } }, source, id);
    assert.deepEqual(errors, []);
    assert.doesNotMatch(result.code, /reducedFont/);
    assert.match(result.code, /targetStyle\.setProperty\(name, value/);
  }
  assert.equal(plugin.transform.call({}, "x", "/other/file.js"), undefined);
});
