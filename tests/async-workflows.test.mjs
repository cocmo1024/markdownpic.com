import assert from "node:assert/strict";
import test from "node:test";
import { saveLatestSnapshot } from "../lib/save-latest.ts";
import { withDeadline } from "../lib/async-deadline.ts";

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes,no) => { resolve=yes; reject=no; });
  return {promise,resolve,reject};
};

test("undo during an in-flight save must persist the visible older snapshot again",async()=>{
  const original={text:"original"}, edited={text:"edited"};
  let current=edited, disk=original;
  const started=deferred(), finishFirstWrite=deferred();
  const writes=[];
  const saving=saveLatestSnapshot({
    read:()=>current,
    isSaved:snapshot=>disk===snapshot,
    write:async snapshot=>{
      writes.push(snapshot.text);
      if(writes.length===1){started.resolve();await finishFirstWrite.promise;}
      disk=snapshot;
    },
  });
  await started.promise;
  current=original; // The original still appears saved until the pending write commits.
  finishFirstWrite.resolve();
  await saving;
  assert.deepEqual(writes,["edited","original"]);
  assert.equal(disk,current);
});
test("continued typing saves the latest snapshot, not an intermediate queued version",async()=>{
  let current={text:"first"},disk=null;
  const started=deferred(),finish=deferred(),writes=[];
  const saving=saveLatestSnapshot({
    read:()=>current,isSaved:snapshot=>snapshot===disk,
    write:async snapshot=>{writes.push(snapshot.text);if(writes.length===1){started.resolve();await finish.promise;}disk=snapshot;},
  });
  await started.promise;
  current={text:"intermediate"};current={text:"latest"};
  finish.resolve();await saving;
  assert.deepEqual(writes,["first","latest"]);assert.equal(disk.text,"latest");
});
test("a save failure terminates without claiming the current snapshot is saved",async()=>{
  const current={text:"keep me"},disk={text:"old"};
  let writes=0;
  await assert.rejects(()=>saveLatestSnapshot({read:()=>current,isSaved:s=>s===disk,write:async()=>{writes++;throw new Error("quota");}}),/quota/);
  assert.equal(writes,1);assert.equal(disk.text,"old");
});
test("a serialized follow-up reads current state when it starts, not when it was queued",async()=>{
  let current={text:"first"},disk=null;
  const started=deferred(),finish=deferred(),writes=[];
  const options={read:()=>current,isSaved:s=>s===disk,write:async s=>{writes.push(s.text);if(writes.length===1){started.resolve();await finish.promise;}disk=s;}};
  const first=saveLatestSnapshot(options);
  await started.promise;
  const queued=first.then(()=>saveLatestSnapshot(options));
  current={text:"newest"};finish.resolve();
  await queued;
  assert.deepEqual(writes,["first","newest"]);assert.equal(current,disk);
});
test("cancelling an asset wait rejects promptly with AbortError",async()=>{
  const controller=new AbortController(),operation=deferred();
  const waiting=withDeadline(operation.promise,{signal:controller.signal,timeoutMs:5000,message:"timeout"});
  controller.abort();
  await assert.rejects(()=>waiting,{name:"AbortError"});
  operation.resolve("late");
});
test("an already-cancelled wait remains cancelled even for a fulfilled operation",async()=>{
  const controller=new AbortController();controller.abort();
  await assert.rejects(()=>withDeadline(Promise.resolve("ready"),{signal:controller.signal,timeoutMs:5000,message:"timeout"}),{name:"AbortError"});
});
test("render timeout provides the supplied recovery message",async()=>{
  await assert.rejects(()=>withDeadline(new Promise(()=>{}),{timeoutMs:5,message:"Choose lower resolution"}),/lower resolution/);
});
test("finished operations detach abort listeners and preserve their result",async()=>{
  const controller=new AbortController();
  assert.equal(await withDeadline(Promise.resolve("done"),{signal:controller.signal,timeoutMs:5000,message:"timeout"}),"done");
  controller.abort();
});
test("a rejection without an Error value does not become a false success",async()=>{
  let rejected=false;
  try { await withDeadline(Promise.reject(undefined),{timeoutMs:5000,message:"timeout"}); } catch { rejected=true; }
  assert.equal(rejected,true);
});
