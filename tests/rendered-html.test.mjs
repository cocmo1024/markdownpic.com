import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { default as worker } from "../dist/server/index.js";

async function request(path = "/") {
  return worker.fetch(new Request("https://markdownpic.com" + path, {headers:{accept:"text/html"}}), { ASSETS: { fetch:async()=>new Response("Not found",{status:404}) } }, {waitUntil(){},passThroughOnException(){}});
}
test("production worker exports a callable handler",()=>{assert.equal(typeof worker.fetch,"function");});
test("server-rendered homepage exposes the tool and correct SEO identity",async()=>{
  const response=await request();assert.equal(response.status,200);
  const html=await response.text();
  assert.match(html,/<title>Markdown to Image/);
  assert.match(html,/<html[^>]*lang="en"/);
  assert.match(html,/<link[^>]*rel="canonical"[^>]*href="https:\/\/markdownpic\.com\/?"/);
  for(const label of ["Markdown source","Open file","Templates","Add image","Customize","Auto split","Long image","Card","Export PNG","My projects"]) assert.ok(html.includes(label),label);
  assert.match(html,/application\/ld\+json/);assert.match(html,/"@type":"WebApplication"/);
  assert.doesNotMatch(html,/aggregateRating|googleads|googlesyndication|adsbygoogle|doubleclick/i);
  assert.doesNotMatch(html,/class="product-intro"|Your site is taking shape/);
});
test("help, privacy and terms return indexable accessible content with self canonicals",async()=>{
  for(const path of ["/help","/privacy","/terms"]) {
    const response=await request(path);assert.equal(response.status,200,path);
    const html=await response.text();
    assert.match(html,/<h1>/);
    assert.ok(html.includes('href="https://markdownpic.com'+path+'"'),path+" canonical");
    assert.match(html,/Open editor/);
    assert.doesNotMatch(html,/adsbygoogle|googlesyndication|doubleclick/);
  }
});
test("sitemap contains only public product routes and robots points to it",async()=>{
  const sitemap=await request("/sitemap.xml");
  assert.equal(sitemap.status,200);
  const xml=await sitemap.text();
  for(const path of ["","/help","/privacy","/terms"]) assert.ok(xml.includes("<loc>https://markdownpic.com"+path+"</loc>"),path);
  assert.doesNotMatch(xml,/asset:|project|draft/);
  const robots=await request("/robots.txt");assert.equal(robots.status,200);
  const text=await robots.text();assert.match(text,/Sitemap: https:\/\/markdownpic.com\/sitemap.xml/);
});
test("unknown routes are real 404s",async()=>{assert.equal((await request("/not-a-real-tool")).status,404);});
test("unused image proxy is absent and security headers protect the document",async()=>{
  assert.equal((await request("/_vinext/image?url=https://example.com/a.jpg&w=640&q=75")).status,404);
  const response=await request();
  assert.equal(response.headers.get("x-content-type-options"),"nosniff");
  assert.equal(response.headers.get("x-frame-options"),"DENY");
});
test("ads load only on the client and ads.txt authorizes the publisher",async()=>{
  for(const path of ["/","/help"]) {
    const html=await (await request(path)).text();
    // The AdSense loader is injected after hydration, never in server HTML or inside the capture card.
    assert.doesNotMatch(html,/pagead2\.googlesyndication|class="adsbygoogle"/,path);
  }
  const adsTxt=await readFile(new URL("../public/ads.txt",import.meta.url),"utf8");
  assert.match(adsTxt,/^google\.com, pub-6017297149672924, DIRECT, f08c47fec0942fa0$/m);
});
test("homepage is the tool only: no promotional sections, one h1, and a sized share image",async()=>{
  const html=await (await request()).text();
  assert.doesNotMatch(html,/home-guide|gallery-item|Built for words that matter/);
  // One page heading; headings inside the preview card belong to the user’s own content.
  assert.equal((html.match(/<h1 class="sr-only">/g)||[]).length,1);
  assert.ok(html.includes('og:image" content="https://markdownpic.com/og.png"'));
});
test("guides are real, linked, canonical pages listed in the sitemap",async()=>{
  const index=await request("/guides");assert.equal(index.status,200);
  const indexHtml=await index.text();
  const slugs=[...indexHtml.matchAll(/href="\/guides\/([a-z0-9-]+)"/g)].map(match=>match[1]);
  assert.ok(new Set(slugs).size>=20,"guide links on the index");
  const xml=await (await request("/sitemap.xml")).text();
  for(const slug of new Set(slugs)){
    const response=await request("/guides/"+slug);assert.equal(response.status,200,slug);
    const html=await response.text();
    assert.ok(html.includes('rel="canonical" href="https://markdownpic.com/guides/'+slug+'"'),slug+" canonical");
    assert.match(html,/href="\/\?template=[a-z]+"/,slug+" opens a template");
    assert.ok(xml.includes("<loc>https://markdownpic.com/guides/"+slug+"</loc>"),slug+" in sitemap");
  }
  assert.equal((await request("/guides/not-a-guide")).status,404);
});
test("the tool links to guides from its Help menu, not from hidden markup",async()=>{
  const html=await (await request()).text();
  assert.match(html,/<details class="help-menu"/);
  assert.ok(html.includes('href="/guides"'));
});
test("legacy reference-site URLs redirect only to matching pages",async()=>{
  const check=async(path,target)=>{const response=await request(path);assert.equal(response.status,301,path);assert.equal(response.headers.get("location"),"https://markdownpic.com"+target,path);};
  await check("/faq/why-is-my-mermaid-diagram-not-rendering-in-markdown/","/guides/mermaid-to-png");
  await check("/syntax/markdown-tables-that-survive-mobile-pdf-and-image-export","/guides/markdown-table-to-image");
  await check("/terms-of-use/","/terms");
  await check("/sitemap-index.xml","/sitemap.xml");
  await check("/posts/convert-markdown-to-long-image/","/guides/long-image");
  const www=await worker.fetch(new Request("https://www.markdownpic.com/guides?x=1"),{ASSETS:{fetch:async()=>new Response("",{status:404})}},{waitUntil(){},passThroughOnException(){}});
  assert.equal(www.status,301);assert.equal(www.headers.get("location"),"https://markdownpic.com/guides?x=1");
  assert.equal((await request("/syntax/markdown-wiki-links-vs-standard-links")).status,404,"unrelated articles stay gone");
});
test("the app is installable: manifest, icons and an offline worker",async()=>{
  const html=await (await request()).text();
  assert.match(html,/rel="manifest" href="\/manifest.webmanifest"/);
  const manifest=JSON.parse(await readFile(new URL("../public/manifest.webmanifest",import.meta.url),"utf8"));
  assert.equal(manifest.start_url,"/");assert.equal(manifest.display,"standalone");
  for(const icon of manifest.icons){const bytes=await readFile(new URL("../public"+icon.src,import.meta.url));assert.equal(bytes.readUInt32BE(16)+"x"+bytes.readUInt32BE(20),icon.sizes,icon.src);}
  const worker=await readFile(new URL("../public/sw.js",import.meta.url),"utf8");
  assert.match(worker,/request\.mode === "navigate"/);assert.match(worker,/url\.origin !== self\.location\.origin\) return/,"third-party requests (ads) are never intercepted");
});
