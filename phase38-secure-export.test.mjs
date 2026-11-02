import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
function extract(a,b){
  const start=html.indexOf(a),end=html.indexOf(b,start+a.length);
  assert(start>=0&&end>start,'Missing production source for '+a);
  return html.slice(start,end);
}
const source=extract('function scanObjectForSensitiveFieldNames(','function clientSecretAudit(')+'\n'+extract('const RAW_BACKUP_EXPORT_KEYS=','// Phase 37: exact-key raw Plan backup restore.');
function context(options={}){
  const raw=new Map(Object.entries({
    'thisweek.userId':'u',
    'thisweek.state.v2':JSON.stringify({userId:'u',config:{payProfile:{netPayAmount:25000}},transactions:[]}),
    'thisweek.uiPrefs.v1':'{"motion":"reduced"}',
    ...(options.values||{})
  }));
  const artifact={};
  const ctx=vm.createContext({
    localDataInventory:()=>({localAvailable:options.storageAvailable!==false,local:[...raw.keys()].map(key=>({key})),session:[{key:'thisweek.auth.session.v1'}]}),
    safeLocalStorageGet:key=>options.failReadKey===key?null:raw.get(key),
    nowIso:()=> '2026-11-02T14:00:00Z',
    Blob:class{constructor(parts){artifact.json=parts.join('')}},
    URL:{createObjectURL:()=> 'blob:mock',revokeObjectURL:()=>{}},
    document:{createElement:()=>({click(){},remove(){}}),body:{appendChild(){}}},
    setTimeout:()=>{},
    sessionStorage:{getItem(){throw Error('Unexpected session value read')}}
  });
  vm.runInContext(source,ctx);
  return {ctx,raw,artifact,run:()=>{vm.runInContext('downloadRawLocalDataExport()',ctx);return JSON.parse(artifact.json)}};
}
test('exact key allowlist does not export arbitrary This Week names even without obvious secret spelling',()=>{
  const h=context({values:{'thisweek.newRemoteCredential':'SK-PRIVATE','thisweek.stats':'SHOULD_NOT_EXPORT'}});
  const result=h.run();
  assert.equal(result.localStorage['thisweek.newRemoteCredential'],undefined);
  assert.equal(result.localStorage['thisweek.stats'],undefined);
  assert.equal(result.excluded.sensitiveLocalKeys,2);
});
test('future secret key in safe-looking namespace cannot be exported',()=>{
  const h=context({values:{'thisweek.cacheMetadata.v2':'EXPOSED_IF_UNSAFE'}});
  const serialized=JSON.stringify(h.run());
  assert(!serialized.includes('EXPOSED_IF_UNSAFE'));
});
test('read-unavailable never generates a deceptively complete backup',()=>{
  const h=context({storageAvailable:false});
  assert.throws(h.run,/cannot be inspected/);
  assert.equal(h.artifact.json,undefined);
});
test('a key that vanished between enumeration and read aborts the backup',()=>{
  const h=context({failReadKey:'thisweek.state.v2'});
  assert.throws(h.run,/unreadable local data/);
  assert.equal(h.artifact.json,undefined);
});
test('nested access token in core Plan is blocked',()=>{
  const h=context({values:{'thisweek.state.v2':JSON.stringify({userId:'u',config:{payProfile:{netPayAmount:123}},auth:{accessToken:'SUPER_SECRET'}})}});
  assert.throws(h.run,/credential field/);
  assert.equal(h.artifact.json,undefined);
});
test('nested credential in an otherwise allowed preference key is blocked',()=>{
  const h=context({values:{'thisweek.uiPrefs.v1':'{"theme":"dark","credential":{"password":"supersecret"}}'}});
  assert.throws(h.run,/credential field/);
  assert.equal(h.artifact.json,undefined);
});
test('known legitimate data remains restorable with explicit key set',()=>{
  const h=context();
  const backup=h.run();
  assert.equal(backup.schema,'thisweek.local-data-export');
  assert.equal(backup.schemaVersion,1);
  assert.equal(backup.dataHealth,'core_plan_parsed');
  assert.deepEqual(Object.keys(backup.localStorage).sort(),['thisweek.state.v2','thisweek.uiPrefs.v1','thisweek.userId'].sort());
  assert.deepEqual(Object.keys(backup.sessionStorage),[]);
});
test('corrupt Plan remains available for forensic manual export but marked as unreadable',()=>{
  const h=context({values:{'thisweek.state.v2':'{broken'}});
  const result=h.run();
  assert.equal(result.localStorage['thisweek.state.v2'],'{broken');
  assert.equal(result.dataHealth,'core_plan_missing_or_unreadable');
});
test('missing Plan is not misrepresented as a valid backup',()=>{
  const h=context();h.raw.delete('thisweek.state.v2');
  const result=h.run();
  assert.equal(result.dataHealth,'core_plan_missing_or_unreadable');
});
test('raw backup export does not read session values or access the network',()=>{
  const h=context();h.run();
  assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest|sendBeacon\s*\(/);
});
