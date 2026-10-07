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
  for(const label of ["Markdown source","Open file","Templates","Add image","Customize","Auto split","Single image","Export PNG","My projects"]) assert.ok(html.includes(label),label);
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
test("homepage guide renders real template cards, steps and questions",async()=>{
  const html=await (await request()).text();
  for(const id of ["quote","steps","math","release"]) assert.ok(html.includes('href="#use-'+id+'"'),id);
  assert.match(html,/class="capture-card/);
  assert.match(html,/Markdown to image in three steps/);
  assert.match(html,/Is MarkdownPic free\?/);
});
test("packaged build retains local-only resources and no deployed project credential",async()=>{
  const config=JSON.parse(await readFile(new URL("../dist/.openai/hosting.json",import.meta.url),"utf8"));
  assert.equal(config.d1,null);assert.equal(config.r2,null);
  assert.equal(config.token,undefined);
});
