import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
function excerpt(a,b){
  const start=html.indexOf(a),end=html.indexOf(b,start+a.length);
  assert(start>=0 && end>start, 'Production source range missing '+a);
  return html.slice(start,end);
}
const source=[
  excerpt('function inferCoreSchemaVersion(', 'function migrateCoreStateV1ToV2('),
  excerpt('function inspectAppStorageNamespace(', 'function appStorageKeys('),
  excerpt('function scanObjectForSensitiveFieldNames(', 'function clientSecretAudit('),
  excerpt('const RAW_BACKUP_EXPORT_KEYS=', 'function clearAllThisWeekLocalData(')
].join('\n');
const keys={
 USER_ID_KEY:'thisweek.userId',STATE_KEY:'thisweek.state.v2',
 UI_PREFS_KEY:'thisweek.uiPrefs.v1',POWER_PREFS_KEY:'thisweek.powerPrefs.v1',
 SAVINGS_GOALS_KEY:'thisweek.savingsGoals.v1',
 CONNECTED_DATA_KEY:'thisweek.connectedData.v1',
 RECOMMENDATION_PREFS_KEY:'thisweek.recommendations.v1',
 SCENARIO_DRAFT_KEY:'thisweek.scenarioDraft.v1',
 LOCAL_ANALYTICS_KEY:'thisweek.analytics.v1',FLEX_CAPS_KEY:'thisweek.flexCaps.v1',
 PRECHECK_HINT_KEY:'thisweek.precheckHint.v1',FIN_EVENT_KEY:'thisweek.finEvent.v1'
};
function boot(){
 const disk=new Map(),sessions=new Map(),warnings=[];
 const localStorage={
   get length(){return disk.size},key(n){return [...disk.keys()][n]??null},
   getItem(k){return disk.get(k)??null},
   setItem(k,v){if(this.failKey===k)throw Error('QuotaExceededError');disk.set(k,v)},
   removeItem(k){if(this.failRemove===k)throw Error('Removal denied');disk.delete(k)}
 };
 const sessionStorage={get length(){return sessions.size},key(n){return [...sessions.keys()][n]??null},getItem(k){return sessions.get(k)??null}};
 const defs=Object.entries(keys).map(([k,v])=>'const '+k+'='+JSON.stringify(v)+';').join('\n');
 const ctx=vm.createContext({localStorage,sessionStorage,console,warnings});
 vm.runInContext(defs+'\nconst CORE_SCHEMA_VERSION=3;\nlet persistedStateQuarantine=null;\nfunction showStoragePersistenceWarning(kind){warnings.push(kind)}\n'+source,ctx);
 const exec=x=>vm.runInContext(x,ctx);
 const state=()=>({
   userId:'u-123',schemaVersion:3,
   config:{payProfile:{netPayAmount:180000},bills:[],livingNeeds:[],discretionary:[]},
   weeks:[{id:'week1',start:'2026-11-01T00:00:00Z',end:'2026-11-08T00:00:00Z',balances:[],billAllocations:[]}],
   transactions:[{id:'tx1',weekId:'week1',amount:2000}],adjustments:[],importedExternalIds:[]
 });
 const backup=()=>({schema:'thisweek.local-data-export',schemaVersion:1,sessionStorage:{},localStorage:{
   'thisweek.userId':'u-123','thisweek.state.v2':JSON.stringify(state()),'thisweek.uiPrefs.v1':'{"motion":"reduced"}'
 }});
 const check=raw=>{ctx.sourceInput=raw;return exec('validatedRawLocalBackup(sourceInput)')};
 const apply=raw=>{ctx.sourceInput=raw;return exec('restoreVerifiedRawLocalBackup(sourceInput)')};
 return {disk,sessions,warnings,localStorage,sessionStorage,state,backup,check,apply,exec,ctx};
}
test('valid backup counts and raw structure',()=>{
 const h=boot(),v=h.check(h.backup());
 assert.equal(v.summary.schemaVersion,3);
 assert.equal(v.summary.weekCount,1);assert.equal(v.summary.transactionCount,1);
 assert.equal(v.summary.keyCount,3);
});
test('valid backup restores exact values, core Plan last',()=>{
 const h=boot(),b=h.backup();h.apply(b);
 for(const [key,value] of Object.entries(b.localStorage))assert.equal(h.disk.get(key),value);
 assert.equal(h.disk.size,3);
});
test('reject token-bearing keys without modifications',()=>{
 const h=boot(),b=h.backup();b.localStorage['thisweek.auth.session.v1']='secret';
 assert.throws(()=>h.apply(b),/unknown or sensitive/);assert.equal(h.disk.size,0);
});
test('reject session data, even in legacy backups',()=>{
 const h=boot(),b=h.backup();b.sessionStorage['thisweek.auth.session.v1']='secret';
 assert.throws(()=>h.check(b),/session data/);
});
test('reject arbitrary unrecognized keys',()=>{
 const h=boot(),b=h.backup();b.localStorage['thisweek.experimental']='value';
 assert.throws(()=>h.check(b),/unknown or sensitive/);
});
test('reject portable export not raw local backup',()=>{
 const h=boot();assert.throws(()=>h.check({exportSchema:'thisweek.portable',exportSchemaVersion:1,data:{}}),/supported raw/);
});
test('reject newer schema without modifying data',()=>{
 const h=boot(),b=h.backup(),st=h.state();st.schemaVersion=999;b.localStorage['thisweek.state.v2']=JSON.stringify(st);
 assert.throws(()=>h.apply(b),/unsupported schema/);assert.equal(h.disk.size,0);
});
test('reject financial transaction with negative money amount',()=>{
 const h=boot(),b=h.backup(),st=h.state();st.transactions[0].amount=-1;b.localStorage['thisweek.state.v2']=JSON.stringify(st);
 assert.throws(()=>h.check(b),/transaction amount/);
});
test('reject mismatched Plan user ID',()=>{
 const h=boot(),b=h.backup();b.localStorage['thisweek.userId']='different';
 assert.throws(()=>h.check(b),/identifier does not match/);
});
test('reject corrupted Plan JSON',()=>{
 const h=boot(),b=h.backup();b.localStorage['thisweek.state.v2']='{BROKEN';
 assert.throws(()=>h.apply(b),/Plan JSON is damaged/);assert.equal(h.disk.size,0);
});
test('reject invalid week dates and noninteger category amounts',()=>{
 const h=boot(),b=h.backup(),st=h.state();st.weeks[0].start='invalid';
 b.localStorage['thisweek.state.v2']=JSON.stringify(st);
 assert.throws(()=>h.check(b),/weekly history/);
 st.weeks[0].start='2026-11-01T00:00:00Z';
 st.config.bills=[{id:'b',amount:0.3}];b.localStorage['thisweek.state.v2']=JSON.stringify(st);
 assert.throws(()=>h.check(b),/category money amounts/);
});
test('reject JSON prototype poisoning properties',()=>{
 const h=boot(),b=h.backup(),st=h.state();
 st.config=JSON.parse('{"__proto__":{"isAdmin":true},"payProfile":{"netPayAmount":1000},"bills":[],"livingNeeds":[],"discretionary":[]}');
 b.localStorage['thisweek.state.v2']=JSON.stringify(st);
 assert.throws(()=>h.check(b),/unsafe object property/);
});
test('populated existing Plan cannot be overwritten',()=>{
 const h=boot();h.disk.set('thisweek.state.v2','ORIGINAL');
 assert.throws(()=>h.apply(h.backup()),/empty This Week/);
 assert.equal(h.disk.get('thisweek.state.v2'),'ORIGINAL');
});
test('nonempty authenticated session blocks restore',()=>{
 const h=boot();h.sessions.set('thisweek.auth.session.v1','TOKEN');
 assert.throws(()=>h.apply(h.backup()),/empty This Week/);assert.equal(h.disk.size,0);
});
test('quarantine blocks restore even if no keys appear',()=>{
 const h=boot();h.exec("persistedStateQuarantine='blocked'");
 assert.throws(()=>h.apply(h.backup()),/empty This Week/);
});
test('mid-write quota failure rolls back fully',()=>{
 const h=boot();h.localStorage.failKey='thisweek.state.v2';
 assert.throws(()=>h.apply(h.backup()),/rolled back/);assert.equal(h.disk.size,0);
});
test('write then throw still rolls back just-written key',()=>{
 const h=boot(),previous=h.localStorage.setItem;
 h.localStorage.setItem=function(k,v){previous.call(this,k,v);if(k==='thisweek.state.v2')throw Error('post-write exception')};
 assert.throws(()=>h.apply(h.backup()),/rolled back/);assert.equal(h.disk.size,0);
});
test('rollback failure quarantines future Plan saves',()=>{
 const h=boot();h.localStorage.failKey='thisweek.state.v2';h.localStorage.failRemove='thisweek.userId';
 assert.throws(()=>h.apply(h.backup()),/rollback could not be verified/);
 assert.equal(h.exec('persistedStateQuarantine'),'Partial restore requires inspection');
 assert(h.warnings.includes('read'));
});
test('reject excessive size and nonstring values',()=>{
 const h=boot(),b=h.backup();b.localStorage['thisweek.uiPrefs.v1']='x'.repeat(4*1024*1024+1);
 assert.throws(()=>h.check(b),/4 MB/);
 b.localStorage['thisweek.uiPrefs.v1']=999;assert.throws(()=>h.check(b),/non-string/);
});
test('reject malformed optional JSON',()=>{
 const h=boot(),b=h.backup();b.localStorage['thisweek.uiPrefs.v1']='{NO';
 assert.throws(()=>h.check(b),/Malformed JSON/);
});
test('UI requires file selection typed confirmation and revalidation',()=>{
 assert.match(html,/id="rawRestoreFile"/);
 assert.match(html,/id="rawRestorePhrase"/);
 assert.match(html,/id="rawRestoreApply" disabled/);
 assert.match(html,/restorePhrase\?\.value\.trim\(\)!=='RESTORE'/);
 assert.match(html,/confirmHighImpactMutation\('Restore this verified raw Plan backup/);
 assert.match(html,/file\.size>RAW_RESTORE_MAX_BYTES/);
 assert.match(html,/restoreVerifiedRawLocalBackup\(pendingRawRestore\)/);
});
test('restore source never fetches data or invokes server side providers',()=>{
 assert(!/\bfetch\s*\(/.test(source));
 assert(!/XMLHttpRequest/.test(source));
 assert(!/sendBeacon/.test(source));
});

test('full export then restore round-trip preserves synthetic financial Plan exactly',()=>{
 const h=boot(),original=h.backup();
 for(const [key,value] of Object.entries(original.localStorage))h.disk.set(key,value);
 let downloaded='';
 h.ctx.localDataInventory=()=>({local:[...h.disk.keys()].map(key=>({key})),session:[]});
 h.ctx.safeLocalStorageGet=key=>h.disk.get(key);
 h.ctx.nowIso=()=> '2026-11-02T14:00:00Z';
 h.ctx.Blob=class {constructor(parts){downloaded=parts.join('')}};
 h.ctx.URL={createObjectURL:()=> 'blob:synthetic',revokeObjectURL:()=>{}};
 h.ctx.document={createElement:()=>({click(){},remove(){}}),body:{appendChild(){}}};
 h.ctx.setTimeout=()=>{};
 h.exec('downloadRawLocalDataExport()');
 const backup=JSON.parse(downloaded);
 assert.equal(backup.sessionStorage && Object.keys(backup.sessionStorage).length,0);
 h.disk.clear();
 const result=h.apply(backup);
 assert.equal(result.transactionCount,1);
 for(const [key,value] of Object.entries(original.localStorage))assert.equal(h.disk.get(key),value);
});

test('unsafe properties and possible secrets in optional JSON are rejected',()=>{
 const h=boot(),b=h.backup();
 b.localStorage['thisweek.uiPrefs.v1']='{"__proto__":{"polluted":true}}';
 assert.throws(()=>h.check(b),/unsafe object property/);
 b.localStorage['thisweek.uiPrefs.v1']='{"accessToken":"secret"}';
 assert.throws(()=>h.check(b),/possible credentials/);
 assert.equal(h.disk.size,0);
});


test('rollback preserves a different value written by a competing tab',()=>{
 const h=boot(),b=h.backup(),original=h.localStorage.setItem.bind(h.localStorage);
 const competing='{"motion":"from-another-tab"}';
 h.localStorage.setItem=function(key,value){
   original(key,value);
   if(key==='thisweek.state.v2'){
     h.disk.set('thisweek.uiPrefs.v1',competing);
     throw Error('interrupted final Plan write');
   }
 };
 assert.throws(()=>h.apply(b),/rollback could not be verified/);
 assert.equal(h.disk.get('thisweek.uiPrefs.v1'),competing);
 assert.equal(h.disk.has('thisweek.userId'),false);
 assert.equal(h.disk.has('thisweek.state.v2'),false);
 assert.equal(h.exec('persistedStateQuarantine'),'Partial restore requires inspection');
 assert(h.warnings.includes('read'));
});

test('rollback preserves a competing tab Plan overwrite and quarantines restore',()=>{
 const h=boot(),b=h.backup(),original=h.localStorage.setItem.bind(h.localStorage);
 const competing='{"schemaVersion":3,"userId":"other-tab"}';
 h.localStorage.setItem=function(key,value){
   original(key,value);
   if(key==='thisweek.state.v2'){
     h.disk.set('thisweek.state.v2',competing);
     throw Error('interrupted after competing Plan update');
   }
 };
 assert.throws(()=>h.apply(b),/rollback could not be verified/);
 assert.equal(h.disk.get('thisweek.state.v2'),competing);
 assert.equal(h.disk.has('thisweek.userId'),false);
 assert.equal(h.disk.has('thisweek.uiPrefs.v1'),false);
 assert.equal(h.exec('persistedStateQuarantine'),'Partial restore requires inspection');
});

test('rollback tolerates an already removed restored key without false quarantine',()=>{
 const h=boot(),b=h.backup(),original=h.localStorage.setItem.bind(h.localStorage);
 h.localStorage.setItem=function(key,value){
   original(key,value);
   if(key==='thisweek.state.v2'){
     h.disk.delete('thisweek.uiPrefs.v1');
     throw Error('interrupted final write');
   }
 };
 assert.throws(()=>h.apply(b),/safely aborted and rolled back/);
 assert.equal(h.disk.size,0);
 assert.equal(h.exec('persistedStateQuarantine'),null);
});

test('rollback skips a key whose setItem failed without writing any value',()=>{
 const h=boot(),b=h.backup(),original=h.localStorage.setItem.bind(h.localStorage);
 h.localStorage.setItem=function(key,value){
   if(key==='thisweek.state.v2')throw Error('pre-write storage failure');
   return original(key,value);
 };
 assert.throws(()=>h.apply(b),/safely aborted and rolled back/);
 assert.equal(h.disk.size,0);
 assert.equal(h.exec('persistedStateQuarantine'),null);
});

test('restore source guards rollback keys by exact expected bytes',()=>{
 assert.match(source,/added\.push\(\[key,value\]\)/);
 assert.match(source,/current!==expectedRestoreValue/);
 assert.match(source,/if\(current===null\)continue/);
 assert.doesNotMatch(source,/for\(const key of added\.reverse\(\)\)/);
});
