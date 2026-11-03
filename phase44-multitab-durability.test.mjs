import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const a=html.indexOf('const runtimePerf='),b=html.indexOf('function formatCents(',a);
assert.ok(a>=0&&b>a,'Missing actual production Plan persistence code');
const source=html.slice(a,b);
const seed=(income=10000)=>({userId:'user-a',schemaVersion:3,config:{payProfile:{netPayAmount:income},bills:[],livingNeeds:[],discretionary:[]},weeks:[],transactions:[],adjustments:[],importedExternalIds:[]});
function h(shared=new Map()){
  let denyRead=false,denyWrite=false;
  const alerts=new Map(), listeners={};
  const storage={
    getItem(key){if(denyRead)throw Error('Safari data access denied');return shared.get(key)??null;},
    setItem(key,v){if(denyWrite)throw Error('Quota exceeded');shared.set(key,v);},
    removeItem(key){shared.delete(key)}
  };
  const document={
    body:{appendChild(v){alerts.set(v.id,v);}},
    getElementById:key=>alerts.get(key)||null,
    createElement:tag=>({tag,id:'',children:[],attributes:{},style:{},textContent:'',href:'',
      setAttribute(k,v){this.attributes[k]=v;},
      append(...nodes){this.children.push(...nodes);},
      remove(){alerts.delete(this.id);}
    })
  };
  const ctx=vm.createContext({localStorage:storage,window:{addEventListener(name,fn){listeners[name]=fn;}},document,console,Date});
  vm.runInContext(`const USER_ID_KEY='thisweek.userId',STATE_KEY='thisweek.state.v2',
    CORE_SCHEMA_VERSION=3,NORMALIZED_MODEL_VERSION='2026-09';
    function nowIso(){return new Date().toISOString();}
    function clone(v){return JSON.parse(JSON.stringify(v));}`+source,ctx);
  const exec=x=>vm.runInContext(x,ctx);
  const write=(income)=>{ctx.draft=seed(income);return exec('writeState(draft)')};
  return {ctx,exec,write,storage,shared,alerts,listeners,setDenyRead:v=>denyRead=v,setDenyWrite:v=>denyWrite=v};
}
test('ordinary repeated edits persist and do not trigger multi-tab warnings',()=>{
 const t=h();t.write(100);t.write(200);t.write(300);
 assert.equal(JSON.parse(t.shared.get('thisweek.state.v2')).config.payProfile.netPayAmount,300);
 assert.equal(t.alerts.size,0);
});
test('unseen second tab write is detected just before the next persistence write',()=>{
 const disk=new Map(),t=h(disk);t.write(100);
 const external=JSON.stringify(seed(999));disk.set('thisweek.state.v2',external);
 t.write(200);
 assert.equal(disk.get('thisweek.state.v2'),external);
 assert.equal(t.exec('runtimeStorageHealth.available'),false);
 assert.match(t.exec('persistedStateQuarantine'),/Another tab/);
 assert.match(t.alerts.get('thisweek-storage-failure').children[0].textContent,/Another This Week tab/);
});
test('a tab cannot initialize over an existing Plan without first reading it',()=>{
 const disk=new Map([['thisweek.state.v2',JSON.stringify(seed(777))]]);
 const t=h(disk);t.write(100);
 assert.equal(JSON.parse(disk.get('thisweek.state.v2')).config.payProfile.netPayAmount,777);
 assert.equal(t.exec('runtimeStorageHealth.available'),false);
});
test('two tabs reading same Plan cannot silently overwrite sequential updates',()=>{
 const disk=new Map([['thisweek.state.v2',JSON.stringify(seed(100))]]);
 const first=h(disk),second=h(disk);
 first.exec('readState()');second.exec('readState()');
 first.write(200);second.write(300);
 assert.equal(JSON.parse(disk.get('thisweek.state.v2')).config.payProfile.netPayAmount,200);
 assert.match(second.exec('persistedStateQuarantine'),/Another tab/);
});
test('external storage event immediately blocks edits in the old tab',()=>{
 const t=h();t.write(100);
 t.shared.set('thisweek.state.v2',JSON.stringify(seed(400)));
 t.listeners.storage({key:'thisweek.state.v2',storageArea:t.storage});
 t.write(200);
 assert.equal(JSON.parse(t.shared.get('thisweek.state.v2')).config.payProfile.netPayAmount,400);
 assert.match(t.exec('persistedStateQuarantine'),/Another tab/);
});
test('unrelated key or other storage area change leaves Plan intact',()=>{
 const t=h();t.write(100);
 t.listeners.storage({key:'other-product.config',storageArea:t.storage});
 t.listeners.storage({key:'thisweek.state.v2',storageArea:{}});
 assert.equal(t.exec('persistedStateQuarantine'),null);
 t.write(110);assert.equal(JSON.parse(t.shared.get('thisweek.state.v2')).config.payProfile.netPayAmount,110);
});
test('same value storage event does not create a false conflict',()=>{
 const t=h();t.write(100);
 t.listeners.storage({key:'thisweek.state.v2',storageArea:t.storage});
 assert.equal(t.exec('persistedStateQuarantine'),null);
});
test('read failure for financial Plan causes quarantine, not a destructive new save',()=>{
 const disk=new Map([['thisweek.state.v2',JSON.stringify(seed(600))]]);
 const t=h(disk);t.setDenyRead(true);
 assert.equal(t.exec('readState()'),null);
 t.setDenyRead(false);t.write(100);
 assert.equal(JSON.parse(disk.get('thisweek.state.v2')).config.payProfile.netPayAmount,600);
 assert.equal(t.exec('runtimeStorageHealth.available'),false);
});
test('getItem failure during the compare-before-write check fails closed',()=>{
 const t=h();t.write(100);t.setDenyRead(true);t.write(200);
 t.setDenyRead(false);
 assert.equal(JSON.parse(t.shared.get('thisweek.state.v2')).config.payProfile.netPayAmount,100);
 assert.match(t.exec('persistedStateQuarantine'),/Cannot verify/);
});
test('a storage remove success never hides an earlier failed write',()=>{
 const t=h();t.setDenyWrite(true);t.write(100);
 assert.equal(t.exec('runtimeStorageHealth.available'),false);
 t.exec("safeLocalStorageRemove('thisweek.unrelated')");
 assert.equal(t.exec('runtimeStorageHealth.available'),false);
});
test('explicit verified reset clears quarantine and allows a new deliberate Plan',()=>{
 const t=h();t.write(100);t.shared.set('thisweek.state.v2',JSON.stringify(seed(200)));
 t.write(300);assert.ok(t.exec('persistedStateQuarantine'));
 t.exec('clearState()');
 assert.equal(t.exec('persistedStateQuarantine'),null);
 t.write(900);
 assert.equal(JSON.parse(t.shared.get('thisweek.state.v2')).config.payProfile.netPayAmount,900);
});
test('storage warnings do not falsely claim that unsaved changes appear in raw backups',()=>{
 const t=h();t.setDenyWrite(true);t.write(123);
 const panel=t.alerts.get('thisweek-storage-failure');
 assert.match(panel.children[0].textContent,/only previously saved data/);
 t.exec("showStoragePersistenceWarning('conflict')");
 assert.equal(t.alerts.size,1);
 assert.match(panel.children[0].textContent,/Another This Week tab/);
 assert.match(panel.children[0].textContent,/not unsaved edits/);
});
test('the live implementation does not open provider or network connections for conflict checks',()=>{
 assert.doesNotMatch(source,/\bfetch\s*\(/);
 assert.doesNotMatch(source,/XMLHttpRequest/);
 assert.match(source,/live!==lastPersistedStateSerialized/);
 assert.match(source,/window\.addEventListener\('storage',handleExternalPlanStorageChange\)/);
});
