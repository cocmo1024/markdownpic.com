import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { IDBFactory, IDBObjectStore } from "fake-indexeddb";
import { zipSync, unzipSync, strToU8, strFromU8 } from "fflate";
import { newProject, newPage, LEGACY_DRAFT_KEY, validateProject } from "../lib/studio-model.ts";
import { initialProject, saveProject, loadProject, listProjects, deleteProject, ProjectConflictError, setActiveProject } from "../lib/project-store.ts";
import { saveLocalImage, loadLocalImage } from "../lib/local-image-store.ts";
import { exportProjectBundle, importProjectBundle } from "../lib/project-bundle.ts";

beforeEach(()=>{
  globalThis.indexedDB = new IDBFactory();
  const values = new Map();
  globalThis.localStorage = {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
  globalThis.window = {indexedDB:globalThis.indexedDB,crypto:globalThis.crypto};
});
test("first start saves an example and next start restores the same document",async()=>{
  const first=await initialProject();
  assert.equal(first.revision,1);
  const second=await initialProject();
  assert.equal(first.id,second.id);
  assert.equal((await listProjects()).length,1);
});
test("legacy draft migrates without deleting original or changing image references",async()=>{
  const legacy={markdown:"# Original\n\n![Photo](asset:img-existing)",fileName:"Recovered",presetId:"story",accent:"#17785b"};
  const raw=JSON.stringify(legacy); localStorage.setItem(LEGACY_DRAFT_KEY,raw);
  const current=await initialProject();
  assert.equal(current.pages[0].markdown,legacy.markdown); assert.equal(current.design.presetId,"story");
  assert.equal(localStorage.getItem(LEGACY_DRAFT_KEY),raw);
});
test("invalid legacy content is not replaced silently",async()=>{
  localStorage.setItem(LEGACY_DRAFT_KEY,"not JSON");
  await assert.rejects(()=>initialProject(),/not been changed/);
  assert.equal(localStorage.getItem(LEGACY_DRAFT_KEY),"not JSON");
  assert.deepEqual(await listProjects(),[]);
});
test("multi-project storage and active preference survive switching",async()=>{
  const a=await saveProject(newProject("A","A"),0), b=await saveProject(newProject("B","B"),0);
  assert.equal((await listProjects()).length,2);
  setActiveProject(a.id);assert.equal((await initialProject()).id,a.id);
  assert.equal((await loadProject(b.id)).pages[0].markdown,"B");
});
test("optimistic revisions prevent stale tab from overwriting the latest text",async()=>{
  const original=await saveProject(newProject("original"),0);
  const latest=await saveProject({...original,pages:[newPage("new text")]},1);
  await assert.rejects(()=>saveProject({...original,pages:[newPage("stale text")]},1),ProjectConflictError);
  assert.equal((await loadProject(original.id)).pages[0].markdown,"new text");
  assert.equal(latest.revision,2);
});
test("synchronous quota errors reject safely, preserve the saved version and allow backup/retry",async()=>{
  const saved=await saveProject(newProject("saved baseline","Storage QA"),0);
  const edited={...saved,pages:[newPage("unsaved content must survive")]};
  const original=IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put=function(value,...args){
    if(this.name==="projects")throw new DOMException("quota","QuotaExceededError");
    return original.call(this,value,...args);
  };
  try {
    await assert.rejects(()=>saveProject(edited,saved.revision),/out of storage.*Back up/);
    assert.equal((await loadProject(saved.id)).pages[0].markdown,"saved baseline");
    const backup=await exportProjectBundle(edited);
    const entries=unzipSync(new Uint8Array(await backup.blob.arrayBuffer()));
    assert.match(strFromU8(entries["source.md"]),/unsaved content must survive/);
  } finally { IDBObjectStore.prototype.put=original; }
  const retry=await saveProject(edited,saved.revision);
  assert.equal(retry.revision,2);
  assert.equal((await loadProject(saved.id)).pages[0].markdown,"unsaved content must survive");
});
test("an aborted write never commits a false successful revision",async()=>{
  const saved=await saveProject(newProject("saved baseline"),0);
  const original=IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put=function(value,...args){
    const request=original.call(this,value,...args);
    if(this.name==="projects")queueMicrotask(()=>this.transaction.abort());
    return request;
  };
  try {
    await assert.rejects(()=>saveProject({...saved,pages:[newPage("not committed")]},1),/Local save failed/);
    const restored=await loadProject(saved.id);
    assert.equal(restored.revision,1);
    assert.equal(restored.pages[0].markdown,"saved baseline");
  } finally { IDBObjectStore.prototype.put=original; }
});
test("deleting one project preserves other projects and image bytes",async()=>{
  const a=await saveProject(newProject("A"),0), b=await saveProject(newProject("B"),0);
  const id=await saveLocalImage(new Blob(["image bytes"],{type:"image/png"}),"a.png");
  await deleteProject(a.id);
  assert.equal(await loadProject(a.id),undefined); assert.ok(await loadProject(b.id));
  assert.equal(await (await loadLocalImage(id)).text(),"image bytes");
});
test("portable bundle contains Markdown, image bytes, and sparse per-page overrides",async()=>{
  const bytes=new Uint8Array([137,80,78,71,1,2,3]);
  const id=await saveLocalImage(new Blob([bytes],{type:"image/png"}),"a.png");
  const project=newProject("# Backup\n\n![A](asset:"+id+")","Backup");
  project.pages.push(newPage("# Second",{presetId:"story"})); project.mode="carousel";
  const exported=await exportProjectBundle(project);
  const files=unzipSync(new Uint8Array(await exported.blob.arrayBuffer()));
  assert.ok(files["project.json"]);assert.ok(files["source.md"]);
  assert.match(strFromU8(files["source.md"]),/assets\/img-/);
  assert.doesNotMatch(strFromU8(files["source.md"]),/asset:/);
  const restored=await importProjectBundle(exported.blob);
  assert.notEqual(restored.id,project.id); assert.equal(restored.revision,0);
  assert.equal(restored.pages.length,2); assert.equal(restored.mode,"carousel");
  assert.deepEqual(restored.pages[1].design,{presetId:"story"});
  const newId=restored.pages[0].markdown.match(/asset:(img-[a-z0-9-]+)/)[1];
  assert.notEqual(newId,id); assert.deepEqual(new Uint8Array(await (await loadLocalImage(newId)).arrayBuffer()),bytes);
  assert.equal((await loadLocalImage(id)).size,bytes.length);
});
test("bundle import rejects traversal, invalid manifests, and missing assets",async()=>{
  const blob=entries=>new Blob([zipSync(entries)]);
  await assert.rejects(()=>importProjectBundle(blob({"../payload":strToU8("x")})),/not safe/);
  await assert.rejects(()=>importProjectBundle(blob({"project.json":strToU8("{}")})),/format/);
  const manifest={format:"markdownpic",version:1,project:newProject("![Missing](asset:img-missing)"),assets:[]};
  await assert.rejects(()=>importProjectBundle(blob({"project.json":strToU8(JSON.stringify(manifest))})),/missing a referenced image/);
  assert.equal((await listProjects()).length,0);
});
test("bundle size limits and unsupported project versions fail before writes",async()=>{
  await assert.rejects(()=>importProjectBundle(new Blob([new Uint8Array(66_000_001)])),/too large/);
  const broken=zipSync({"project.json":strToU8(JSON.stringify({format:"markdownpic",version:1,project:{version:99},assets:[]}))});
  await assert.rejects(()=>importProjectBundle(new Blob([broken])),/version/);
  assert.equal((await listProjects()).length,0);
});
test("project validation retains sparse overrides instead of freezing every setting",()=>{
  const project=newProject();project.pages[0].design={padding:30};
  assert.deepEqual(validateProject(project).pages[0].design,{padding:30});
});
test("bundle image verification happens before image storage writes",async()=>{
  const id=await saveLocalImage(new Blob(["image"],{type:"image/png"}),"a.png");
  const project=newProject("![A](asset:"+id+")");
  const bundle=await exportProjectBundle(project);
  let verified=0;
  await assert.rejects(()=>importProjectBundle(bundle.blob,async()=>{verified++;throw new Error("cannot decode");}),/cannot decode/);
  assert.equal(verified,1);assert.equal(await (await loadLocalImage(id)).text(),"image");
  assert.equal((await listProjects()).length,0);
});
