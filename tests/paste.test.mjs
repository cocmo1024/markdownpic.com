import assert from "node:assert/strict";
import test from "node:test";
import { htmlToMarkdown, shouldConvertHtml } from "../lib/smart-paste.ts";

test("rich text converts; Markdown and code stay as plain text", () => {
  assert.equal(shouldConvertHtml("<h2>Title</h2><p>Some <strong>bold</strong> text</p>", "Title\nSome bold text"), true);
  assert.equal(shouldConvertHtml("<p><strong>Note</strong></p>", "**Note**"), false, "plain text is already Markdown");
  assert.equal(shouldConvertHtml("<pre><code><span style=color:red>const</span> a</code></pre>", "const a"), false, "code editor copy");
  assert.equal(shouldConvertHtml("<span>just text</span>", "just text"), false, "no structure");
  assert.equal(shouldConvertHtml("", "text"), false);
});

test("HTML becomes clean GitHub-flavored Markdown", async () => {
  const markdown = await htmlToMarkdown('<h1>Plan</h1><p>Read <a href="https://example.com">this</a> &amp; <em>that</em>.</p><ul><li>One</li><li><strong>Two</strong></li></ul><table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table><script>alert(1)</script><p>Done&nbsp;now</p>');
  assert.match(markdown, /^# Plan$/m);
  assert.match(markdown, /\[this\]\(https:\/\/example\.com\) & \*that\*\./);
  assert.match(markdown, /^- One$/m);
  assert.match(markdown, /^- \*\*Two\*\*$/m);
  assert.match(markdown, /\| A \| B \|/);
  assert.doesNotMatch(markdown, /alert/);
  assert.match(markdown, /Done now/);
});
