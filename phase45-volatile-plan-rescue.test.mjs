import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
function extract(start,end){
 const p=html.indexOf(start),q=html.indexOf(end,p+start.length);
 assert(p>=0&&q>p,'Cannot find production function: '+start);
 return html.slice(p,q);
}
const persistence=extract('const runtimePerf=','function formatCents(');
const rescue=extract('// Phase 45: voluntary in-memory Plan evidence','// Phase 37: exact-key raw Plan backup restore');
const security=extract('function scanObjectForSensitiveFieldNames(', 'function clientSecretAudit(');
const confirmFn=extract('function confirmHighImpactMutation(', 'function inspectAppStorageNamespace(');
const sensitive=extract('function confirmSensitiveExport(', 'const RAW_BACKUP_EXPORT_KEYS=');
function harness(){
 const disk=new Map(),elements=new Map(),saved=[],objects=new Map();
 let deny=false,confirm=true;
 const localStorage={
   getItem:key=>disk.get(key)??null,
   setItem(key,v){if(deny)throw Error('Quota exceeded');disk.set(key,v);},
   removeItem:key=>disk.delete(key)
 };
 function node(tag){return{
   tag,id:'',href:'',download:'',textContent:'',attributes:{},children:[],listeners:{},style:{},type:'',
   setAttribute(k,v){this.attributes[k]=v;},
   append(...parts){this.children.push(...parts);},
   appendChild(part){this.children.push(part);},
   addEventListener(name,cb){this.listeners[name]=cb;},
   click(){this.listeners.click?.();if(this.tag==='a')saved.push({href:this.href,download:this.download});},
   remove(){if(this.id)elements.delete(this.id);}
 }};
 const document={body:{appendChild(n){if(n.id)elements.set(n.id,n);}},
   getElementById:key=>elements.get(key)||null,createElement:node};
 const URL={
   createObjectURL(blob){const id='blob:'+objects.size;objects.set(id,blob);return id;},
   revokeObjectURL(){}
 };
 const ctx=vm.createContext({localStorage,document,URL,Blob,TextEncoder,Date,console,
   setTimeout(){},window:{confirm:()=>confirm,addEventListener(){}}});
 const setup="const USER_ID_KEY='thisweek.userId',STATE_KEY='thisweek.state.v2';const CORE_SCHEMA_VERSION=3,NORMALIZED_MODEL_VERSION='2026-09';function nowIso(){return new Date().toISOString()}function clone(v){return JSON.parse(JSON.stringify(v))}";
 vm.runInContext(setup+persistence+'\n'+security+'\n'+confirmFn+'\n'+sensitive+'\n'+rescue,ctx);
 const exec=js=>vm.runInContext(js,ctx);
 const plan=(income=100)=>({userId:'qa-user',schemaVersion:3,config:{payProfile:{netPayAmount:income},bills:[],livingNeeds:[],discretionary:[]},weeks:[],transactions:[],adjustments:[],importedExternalIds:[]});
 return {disk,elements,saved,objects,exec,ctx,plan,
    denyWrite:x=>deny=x,allowExport:x=>confirm=x,write:p=>{ctx.input=p;return exec('writeState(input)')}};
}
test('quota failure keeps newer in-memory money values and exposes a rescue control',()=>{
 const h=harness();h.write(h.plan(100));h.denyWrite(true);h.write(h.plan(200));
 const panel=h.elements.get('thisweek-storage-failure');assert(panel);
 const button=panel.children.find(x=>x.tag==='button');assert(button);
 assert.match(button.textContent,/in-memory Plan/);
 assert.equal(h.objects.size,0);
 assert.equal(JSON.parse(h.exec('buildVolatilePlanRescue().json')).state.config.payProfile.netPayAmount,200);
 assert.equal(JSON.parse(h.disk.get('thisweek.state.v2')).config.payProfile.netPayAmount,100);
});
test('a real user click saves a separate non-restorable recovery JSON',async()=>{
 const h=harness();h.denyWrite(true);h.write(h.plan(222));
 h.elements.get('thisweek-storage-failure').children.find(x=>x.tag==='button').click();
 assert.equal(h.saved.length,1);
 assert.match(h.saved[0].download,/UNSAVED-manual-review/);
 const json=JSON.parse(await [...h.objects.values()][0].text());
 assert.equal(json.status,'unverified_in_memory_only');
 assert.match(json.warning,/NOT a restorable raw backup/);
 assert.equal(json.state.config.payProfile.netPayAmount,222);
 assert.equal(h.disk.has('thisweek.state.v2'),false);
});
test('user cancellation never creates a file',()=>{
 const h=harness();h.denyWrite(true);h.write(h.plan());
 h.allowExport(false);
 h.elements.get('thisweek-storage-failure').children.find(x=>x.tag==='button').click();
 assert.equal(h.objects.size,0);assert.equal(h.saved.length,0);
});
test('nested access-token key blocks rescue before data leaves memory',()=>{
 const h=harness();h.denyWrite(true);
 const p=h.plan();p.config.authorization={accessToken:'SECRET'};
 h.write(p);
 assert.throws(()=>h.exec('buildVolatilePlanRescue()'),/Possible credentials detected/);
 assert.equal(h.objects.size,0);
});
test('no volatile Plan exposes no rescue action',()=>{
 const h=harness();h.exec("showStoragePersistenceWarning('read')");
 assert.equal(h.elements.get('thisweek-storage-failure').children.filter(x=>x.tag==='button').length,0);
 assert.throws(()=>h.exec('buildVolatilePlanRescue()'),/No in-memory Plan/);
});
test('malformed or invalid volatile Plan never claims recovery success',()=>{
 const h=harness();
 h.exec("volatileStateSerialized='null'");
 assert.throws(()=>h.exec('buildVolatilePlanRescue()'),/no valid user/);
 h.exec("volatileStateSerialized='{broken'");
 assert.throws(()=>h.exec('buildVolatilePlanRescue()'),/cannot be safely parsed/);
});
test('recovery is bounded to 4 MB',()=>{
 const h=harness();h.exec("volatileStateSerialized='x'.repeat(4*1024*1024+1)");
 assert.throws(()=>h.exec('buildVolatilePlanRescue()'),/larger than the 4 MB/);
});
test('a quarantined multi-tab edit saves the attempted newer Plan separately from the older in-memory copy',()=>{
 const h=harness();h.write(h.plan(100));
 h.exec("quarantinePlanStorage('Another tab changed your financial Plan.','conflict')");
 h.write(h.plan(900));
 const result=JSON.parse(h.exec('buildVolatilePlanRescue().json'));
 assert.equal(result.origin,'blocked_conflict_draft');
 assert.equal(result.state.config.payProfile.netPayAmount,900);
 assert.equal(JSON.parse(h.disk.get('thisweek.state.v2')).config.payProfile.netPayAmount,100);
});
test('rescue button becomes available if a previously empty quarantined tab receives a blocked edit',()=>{
 const h=harness();h.exec("quarantinePlanStorage('Stored Plan unreadable')");
 assert.equal(h.elements.get('thisweek-storage-failure').children.filter(x=>x.tag==='button').length,0);
 h.write(h.plan(555));
 const panel=h.elements.get('thisweek-storage-failure');
 assert.equal(panel.children.filter(x=>x.tag==='button').length,1);
 assert.equal(JSON.parse(h.exec('buildVolatilePlanRescue().json')).state.config.payProfile.netPayAmount,555);
});
test('failed local reset preserves attempted unsaved edits for manual recovery',()=>{
 const h=harness();h.denyWrite(true);h.write(h.plan(42));
 h.ctx.localStorage.removeItem=()=>{throw Error('removal denied')};
 h.exec('clearState()');
 assert.equal(JSON.parse(h.exec('buildVolatilePlanRescue().json')).state.config.payProfile.netPayAmount,42);
 assert.ok(h.exec('persistedStateQuarantine'));
});
test('successful deliberate reset clears all tentative recovery drafts',()=>{
 const h=harness();h.write(h.plan(100));
 h.exec("quarantinePlanStorage('Another tab changed your financial Plan.','conflict')");
 h.write(h.plan(900));
 h.exec('clearState()');
 assert.equal(h.exec('blockedPlanDraftSerialized'),null);
 assert.throws(()=>h.exec('buildVolatilePlanRescue()'),/No in-memory Plan/);
});
test('existing warning works with browser HTMLCollection lacking Array.prototype.some',()=>{
 const h=harness();h.denyWrite(true);h.write(h.plan(100));
 const panel=h.elements.get('thisweek-storage-failure');
 panel.children={0:panel.children[0],1:panel.children[1],2:panel.children[2],length:3};
 assert.doesNotThrow(()=>h.exec("showStoragePersistenceWarning('conflict')"));
 assert.equal(panel.children.length,3);
});
test('rescue cannot upload, modify persistent Plan, or export session bearer tokens',()=>{
 assert.doesNotMatch(rescue,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage\.setItem|sessionStorage/);
 assert.match(rescue,/confirmSensitiveExport/);
 assert.match(rescue,/thisweek\.volatile-plan-review\.v1/);
 assert.match(rescue,/60_000/);
});
