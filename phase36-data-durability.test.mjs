import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const a=html.indexOf('const runtimePerf='),b=html.indexOf('function formatCents(',a);
assert(a>=0 && b>a,'Cannot locate the production persistence implementation');
const implementation=html.slice(a,b);
const boot= `
const USER_ID_KEY="thisweek.userId",STATE_KEY="thisweek.state.v2";
const CORE_SCHEMA_VERSION=3,NORMALIZED_MODEL_VERSION="2026-09";
function nowIso(){return new Date().toISOString()}
function clone(v){return JSON.parse(JSON.stringify(v))}
`+implementation;
function harness(){
 const disk=new Map(),elements=new Map();
 let failSet=false,failGet=false;
 const localStorage={
   getItem(k){if(failGet)throw Error('Reads blocked');return disk.get(k)??null;},
   setItem(k,v){if(failSet)throw Error('Quota exceeded');disk.set(k,v)},
   removeItem(k){disk.delete(k)}
 };
 function node(tag){
   return {tag,id:'',attributes:{},style:{},children:[],textContent:'',href:'',
     setAttribute(k,v){this.attributes[k]=v},
     append(...c){this.children.push(...c)},
     remove(){elements.delete(this.id)}
   };
 }
 const document={
   body:{appendChild(e){elements.set(e.id,e)}},
   getElementById:id=>elements.get(id)||null,
   createElement:node
 };
 const ctx=vm.createContext({localStorage,document,console,Date});
 vm.runInContext(boot,ctx);
 const exec=js=>vm.runInContext(js,ctx);
 const state=(income=10000)=>({userId:'qa-user',schemaVersion:3,config:{payProfile:{netPayAmount:income},bills:[],livingNeeds:[],discretionary:[]},weeks:[],transactions:[],adjustments:[],importedExternalIds:[]});
 return {ctx,exec,disk,elements,state,failSets:v=>failSet=v,failGets:v=>failGet=v};
}
test('healthy Plan write persists and creates no false warning',()=>{
 const t=harness();
 t.ctx.input=t.state();t.exec('writeState(input)');
 assert.equal(t.disk.has('thisweek.state.v2'),true);
 assert.equal(t.exec('runtimeStorageHealth.available'),true);
 assert.equal(t.elements.size,0);
});
test('QuotaExceeded write retains volatile data, fails visible, does not claim persistence',()=>{
 const t=harness();t.failSets(true);
 t.ctx.input=t.state(12345);t.exec('writeState(input)');
 assert.equal(t.disk.has('thisweek.state.v2'),false);
 assert.equal(t.exec('runtimeStorageHealth.available'),false);
 assert.equal(t.exec('runtimeStorageHealth.writable'),false);
 assert.equal(t.exec('readState().config.payProfile.netPayAmount'),12345);
 const warning=t.elements.get('thisweek-storage-failure');
 assert(warning);
 assert.equal(warning.attributes.role,'alert');
 assert.match(warning.children[0].textContent,/could not be saved/);
 assert.equal(warning.children[1].href,'#privacy');
});
test('successful reads do not mask prior failed writes',()=>{
 const t=harness();t.failSets(true);t.ctx.input=t.state();t.exec('writeState(input)');
 t.exec("safeLocalStorageGet('thisweek.userId')");
 assert.equal(t.exec('runtimeStorageHealth.readable'),true);
 assert.equal(t.exec('runtimeStorageHealth.writable'),false);
 assert.equal(t.exec('runtimeStorageHealth.available'),false);
});
test('successful retry persists exact newer state and clears warning',()=>{
 const t=harness();t.ctx.input=t.state(100);
 t.exec('writeState(input)');
 t.failSets(true);t.ctx.input=t.state(200);t.exec('writeState(input)');
 assert.equal(JSON.parse(t.disk.get('thisweek.state.v2')).config.payProfile.netPayAmount,100);
 assert.equal(t.exec('readState().config.payProfile.netPayAmount'),200);
 assert.equal(t.elements.size,1);
 t.failSets(false);t.exec('writeState(input)');
 assert.equal(JSON.parse(t.disk.get('thisweek.state.v2')).config.payProfile.netPayAmount,200);
 assert.equal(t.exec('runtimeStorageHealth.available'),true);
 assert.equal(t.elements.size,0);
});
test('repeated failed writes do not stack warning panels',()=>{
 const t=harness();t.failSets(true);
 t.ctx.input=t.state(100);t.exec('writeState(input)');
 t.ctx.input=t.state(200);t.exec('writeState(input)');
 assert.equal(t.elements.size,1);
});
test('cyclic input is not falsely represented as persisted',()=>{
 const t=harness();const s=t.state();s.cycle=s;t.ctx.input=s;
 t.exec('writeState(input)');
 assert.equal(t.disk.has('thisweek.state.v2'),false);
 assert.equal(t.exec('runtimeStorageHealth.available'),false);
 assert.equal(t.elements.size,1);
});
test('storage read failure is reported separately',()=>{
 const t=harness();t.failGets(true);t.exec("safeLocalStorageGet('thisweek.state.v2')");
 assert.equal(t.exec('runtimeStorageHealth.readable'),false);
 assert.equal(t.exec('runtimeStorageHealth.available'),false);
});
test('a storage failure does not upload data or start network access',()=>{
 const t=harness();t.failSets(true);t.ctx.input=t.state();
 t.exec('writeState(input)');
 assert.equal(t.elements.size,1);
 assert(!implementation.includes('fetch('));
 assert(!implementation.includes('XMLHttpRequest'));
});
test('corrupt stored financial state is preserved and no new write overwrites it',()=>{
 const t=harness();
 t.disk.set('thisweek.state.v2','{BROKEN');
 assert.equal(t.exec('readState()'),null);
 assert.equal(t.exec('runtimeStorageHealth.available'),false);
 assert.match(t.elements.get('thisweek-storage-failure').children[0].textContent,/saves are blocked/);
 t.ctx.input=t.state(30000);t.exec('writeState(input)');
 assert.equal(t.disk.get('thisweek.state.v2'),'{BROKEN');
 assert.equal(t.exec('runtimeStorageHealth.available'),false);
 t.exec("safeLocalStorageGet('thisweek.state.v2')");
 assert.equal(t.exec('runtimeStorageHealth.available'),false);
});
test('a future-schema persisted Plan cannot be overwritten by older code',()=>{
 const t=harness();
 t.disk.set('thisweek.state.v2',JSON.stringify({...t.state(90),schemaVersion:999}));
 assert.equal(t.exec('readState()'),null);
 t.ctx.input=t.state(100);t.exec('writeState(input)');
 assert.equal(JSON.parse(t.disk.get('thisweek.state.v2')).schemaVersion,999);
 assert.match(t.exec('persistedStateQuarantine'),/newer schema/);
});
test('explicit verified clear releases read quarantine and permits fresh plan',()=>{
 const t=harness();
 t.disk.set('thisweek.state.v2','{BROKEN');
 t.exec('readState()');
 t.exec('clearState()');
 assert.equal(t.exec('persistedStateQuarantine'),null);
 assert.equal(t.elements.size,0);
 t.ctx.input=t.state(550);t.exec('writeState(input)');
 assert.equal(JSON.parse(t.disk.get('thisweek.state.v2')).config.payProfile.netPayAmount,550);
});
test('Privacy copy accurately states that backups are not automatic',()=>{
 assert.match(html,/Browser-managed, not permanent/);
 assert.match(html,/No automatic cloud backup is enabled/);
 assert.match(html,/Export backups regularly/);
});
test('source implementation remains a single, unambiguous excerpt',()=>{
 assert.equal(html.indexOf('const runtimePerf='),html.lastIndexOf('const runtimePerf='));
 assert.equal(html.indexOf('function writeState('),html.lastIndexOf('function writeState('));
 assert(implementation.includes('showStoragePersistenceWarning'));
});
