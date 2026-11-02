import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const start=html.indexOf('function isRawBackupSafeLocalKey(');
const end=html.indexOf('function clearAllThisWeekLocalData(',start);
assert(start>0 && end>start, 'Raw backup functions must be present');
const source=html.slice(start,end);
function run(){
 const saved={},local={
  'thisweek.state.v2':'{"budget":100}',
  'thisweek.userId':'local-id',
  'thisweek.uiPrefs.v1':'{"motion":"calm"}',
  'thisweek.auth.session.v1':'VERY_SECRET_ACCESS_TOKEN',
  'thisweek.token.preview':'SECRET_PREVIEW',
  'thisweek.api.secret':'SECRET_KEY',
 };
 const ctx={
  nowIso:()=> '2026-11-02T13:30:00Z',
  localDataInventory:()=>({local:Object.keys(local).map(key=>({key})),session:[{key:'thisweek.auth.session.v1'},{key:'thisweek.ephemeral.session'}]}),
  safeLocalStorageGet:key=>local[key],
  sessionStorage:{getItem:()=>{throw new Error('session must never be read for a backup')}},
  Blob:class {constructor(parts){saved.payload=parts.join('')}},
  URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>{}},
  document:{createElement:()=>({click(){},remove(){}}),body:{appendChild(){}}},
  setTimeout:()=>{},
 };
 vm.createContext(ctx);
 vm.runInContext(source,ctx);
 vm.runInContext('downloadRawLocalDataExport()',ctx);
 return {data:JSON.parse(saved.payload),serialized:saved.payload,ctx,local};
}
test('existing financial state and presentation preferences remain in downloaded backup',()=>{
 const {data}=run();
 assert.equal(data.localStorage['thisweek.state.v2'],'{"budget":100}');
 assert.equal(data.localStorage['thisweek.userId'],'local-id');
 assert.equal(data.localStorage['thisweek.uiPrefs.v1'],'{"motion":"calm"}');
});
test('auth bearer tokens, credential-shaped keys and all sessionStorage are excluded',()=>{
 const {data,serialized}=run();
 assert.deepEqual(Object.keys(data.sessionStorage),[]);
 assert.equal(data.excluded.sessionStorageKeys,2);
 assert.equal(data.excluded.sensitiveLocalKeys,3);
 for(const secret of ['VERY_SECRET_ACCESS_TOKEN','SECRET_PREVIEW','SECRET_KEY'])assert(!serialized.includes(secret));
});
test('unrelated arbitrary origin storage cannot enter This Week backup',()=>{
 const {ctx}=run();
 for(const key of ['otherapp.state','something','thisweek2.state','thisweek.token','thisweek.auth.session.v1','thisweek.api.secret']){
  assert.equal(vm.runInContext('isRawBackupSafeLocalKey('+JSON.stringify(key)+')',ctx),false,key);
 }
 assert.equal(vm.runInContext("isRawBackupSafeLocalKey('thisweek.state.v2')",ctx),true);
});
test('backup code performs no upload or third-party network call',()=>{
 assert(!/\bfetch\s*\(/.test(source));
 assert(!/XMLHttpRequest/.test(source));
 assert(!/sendBeacon/.test(source));
 assert.match(html,/Raw backups deliberately exclude all sessionStorage values/);
});
