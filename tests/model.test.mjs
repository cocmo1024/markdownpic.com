import assert from "node:assert/strict";
import test from "node:test";
import { newProject, newPage, effectiveDesign, normalizeDesign, validateProject, canvasPresets, themes, accents, contrastRatio, readableAccent, foregroundOn, slugify } from "../lib/studio-model.ts";
import { splitMarkdownPages, serializePages, pagesFromMarkdown, semanticBlocks, splitOversizeBlock, localAssetIds } from "../lib/markdown-document.ts";
import { paginateMarkdown } from "../lib/pagination.ts";
import { assertExportSize, EXTENDED_LIMITS, inspectCard } from "../lib/capture-checks.ts";

test("all fixed presets match promised output dimensions at 2x", () => {
  assert.deepEqual(canvasPresets.filter(p => p.height).map(p => [p.id,p.width*2,p.height*2]), [["square",1080,1080],["portrait",1080,1350],["story",1080,1920],["social",1200,630],["wide",1280,720],["tall",1080,1440]]);
});
test("page-specific design follows the page through reorder and is ignored in single mode", () => {
  const project = newProject("A");
  project.pages.push(newPage("B", { theme: "midnight" }));
  project.mode = "carousel";
  assert.equal(effectiveDesign(project, project.pages[1]).theme,"midnight");
  project.pages.reverse();
  assert.equal(effectiveDesign(project, project.pages[0]).theme,"midnight");
  project.mode = "single";
  assert.equal(effectiveDesign(project, project.pages[0]).theme,project.design.theme);
});
test("design normalization refuses malformed dimensions, colors and settings", () => {
  const normalized=normalizeDesign({padding:Infinity,fontScale:-100,presetId:"evil",accent:"url(x)",watermarkText:"a".repeat(100),renderScale:8});
  assert.equal(normalized.padding,44); assert.equal(normalized.fontScale,76); assert.equal(normalized.presetId,"long"); assert.equal(normalized.renderScale,2); assert.equal(normalized.watermarkText.length,80);
});
test("themes and selectable accents meet readable contrast", () => {
  for(const theme of themes) for(const accent of accents) {
    const safe=readableAccent(accent,theme.background);
    assert.ok(contrastRatio(safe,theme.background)>=4.5,theme.id+" "+accent);
    assert.ok(contrastRatio(safe,foregroundOn(safe))>=4.5,theme.id+" heading");
  }
});
test("project imports reject invalid versions, empty pages, oversized source and too many pages",()=>{
  assert.throws(()=>validateProject({version:99}),/version/);
  assert.throws(()=>validateProject({...newProject(),pages:[]}),/1–20/);
  assert.throws(()=>validateProject(newProject("a".repeat(120001))),/120,000/);
  assert.throws(()=>validateProject({...newProject(),pages:Array.from({length:21},()=>newPage())}),/1–20/);
  const project=validateProject(newProject("# A"));
  assert.equal(project.pages[0].markdown,"# A");
});
test("safe download names retain unicode and remove path separators",()=>{ assert.equal(slugify("../My File / Test.png"),"my-file-test-png"); assert.equal(slugify("中文 Notes"),"中文-notes"); });
test("page breaks are case insensitive and preserve empty pages",()=>{
  const pages=splitMarkdownPages("<!-- PAGE -->\n\n# Second\n\n<!-- page -->");
  assert.deepEqual(pages.map(p=>p.markdown),["","# Second",""]);
});
test("page markers inside fenced code, quotes and lists do not split",()=>{
  const source="~~~html\n<!-- page -->\n~~~\n\n> <!-- page -->\n\n- <!-- page -->";
  assert.equal(splitMarkdownPages(source).length,1);
  assert.equal(splitMarkdownPages("    <!-- page -->").length,1);
});
test("serializing and parsing does not accumulate whitespace on every keystroke",()=>{
  const first=[newPage("# First\n\nA paragraph"),newPage(""),newPage("# Last")];
  let source=serializePages(first);
  for(let i=0;i<20;i++) source=serializePages(pagesFromMarkdown(source));
  assert.equal(source,serializePages(first));
});
test("asset references are discovered in Markdown images and reference definitions, never code",()=>{
  assert.deepEqual(localAssetIds("![a](asset:img-real)\n\n![b][ref]\n\n[ref]: asset:img-ref\n\n~~~md\n![x](asset:img-code)\n~~~"),["img-real","img-ref"]);
});
test("semantic blocks retain heading with next block and share reference definitions",()=>{
  const {blocks,definitions}=semanticBlocks("# Title\n\nA paragraph [x][ref].\n\n## Next\n\n- A\n- B\n\n[ref]: https://example.com");
  assert.equal(blocks.length,2); assert.match(blocks[0].source,/# Title[\s\S]+A paragraph/); assert.match(definitions,/\[ref\]/);
});
test("oversize splitting preserves code and inline formatting",()=>{
  assert.equal(splitOversizeBlock("~~~js\n"+("a".repeat(100))+"\n~~~"),null);
  const source="Plain text ".repeat(20)+"**bold phrase together** "+"More plain text ".repeat(20);
  const parts=splitOversizeBlock(source);
  assert.equal(parts.join(""),source);
  assert.ok(parts.some(p=>p.includes("**bold phrase together**")));
});
test("long lists keep continuation numbers and tables repeat header",()=>{
  const list=splitOversizeBlock("3. a\n4. b\n5. c\n6. d");
  assert.match(list[1],/^5\. c/);
  const table=splitOversizeBlock("| A | B |\n|---|---|\n|1|2|\n|3|4|\n|5|6|");
  assert.match(table[1],/^\| A \| B \|\n\|---\|---\|/);
});
test("pagination measures candidates and produces individually fitting pages",async()=>{
  const source=["First ".repeat(22),"Second ".repeat(24),"Third ".repeat(20)].join("\n\n");
  const pages=await paginateMarkdown(source,async text=>({fits:text.length<=190,reason:"height"}));
  assert.ok(pages.length>=3); assert.ok(pages.every(p=>p.length<=190));
  assert.equal(pages.join(" ").replace(/\s+/g," ").trim(),source.replace(/\s+/g," ").trim());
});
test("pagination abort and unsafe block failures preserve the original source",async()=>{
  const source="~~~js\n"+"x".repeat(250)+"\n~~~";
  await assert.rejects(()=>paginateMarkdown(source,async()=>({fits:false,reason:"height"})),/code block/);
  await assert.rejects(()=>paginateMarkdown("# Heading",async()=>({fits:false,reason:"asset",message:"missing"})),/missing/);
  const controller=new AbortController();controller.abort();
  await assert.rejects(()=>paginateMarkdown("# Heading",async()=>({fits:true}),controller.signal),/cancelled/);
});
test("capture size checks cover dimension, area, batch and non-finite values",()=>{
  assert.doesNotThrow(()=>assertExportSize(1080,1920));
  for (const values of [[0,1],[1,20000],[6000,6000],[1080,1920,79_000_000],[NaN,100],[100,Infinity]]) assert.throws(()=>assertExportSize(...values),/too large/);
  // A 3x long image fits only where the browser proved it can allocate the canvas.
  assert.throws(()=>assertExportSize(1800,30000),/too large/);
  assert.doesNotThrow(()=>assertExportSize(1800,30000,0,EXTENDED_LIMITS));
  assert.throws(()=>assertExportSize(1800,40000,0,EXTENDED_LIMITS),/too large/);
});
test("capture preflight catches both axes, missing assets, loading and empty states",()=>{
  const content={textContent:"Hello",scrollWidth:400,clientWidth:400,querySelector:()=>null};
  const card={scrollWidth:500,clientWidth:500,scrollHeight:600,clientHeight:600,querySelector:selector=>selector===".capture-content"?content:null,querySelectorAll:()=>[]};
  assert.equal(inspectCard(card),null);
  card.scrollHeight=650;assert.equal(inspectCard(card).code,"height");card.scrollHeight=600;
  content.scrollWidth=420;assert.equal(inspectCard(card).code,"width");content.scrollWidth=400;
  content.textContent="";assert.equal(inspectCard(card).code,"empty");content.textContent="Hello";
  card.querySelectorAll=()=>[{complete:false}];assert.equal(inspectCard(card).code,"loading");
  card.querySelectorAll=()=>[{complete:true,naturalWidth:0}];assert.equal(inspectCard(card).code,"asset");
});
