import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {auditDeployment, verifyOnce, verifyManifest, verifyIndexCsp, verifyPublishedOfflineAssets, assetUrl, REQUIRED_ASSETS} from './verify-deployed-release.mjs';
const sha='ab4336e55faf04235d57a5a389c5f816a477c61e';
const old='8913aed99abd1106f346028a74e41acaa2e93bfe';
const base='https://bennybundles.github.io/Thisweekmvp/';
const config={release:'v0.15.0-phase15',rollbackCommit:'351a052ba214d4813b296b4cd3dc7965e695b6e1',rollbackBranch:'rollback/phase15-pre-release-2026-09-18',stateSchema:3,portableSchema:1};
const manifest=()=>({application:'This Week',channel:'production',commit:sha,shortCommit:sha.slice(0,8),release:config.release,rollbackCommit:config.rollbackCommit,rollbackBranch:config.rollbackBranch,stateSchema:3,portableSchema:1,workflowRunId:'12345',deployedAt:'2026-11-02T12:00:00Z'});
const scripts='<script>const a=1;</script><script>const b=2;</script>';
const hashes=['const a=1;','const b=2;'].map(x=>createHash('sha256').update(x).digest('base64'));
const csp='<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\' '+hashes.map(h=>"'sha256-"+h+"'").join(' ')+'; script-src-attr \'none\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: blob:; font-src \'self\' data:; connect-src \'none\'; media-src \'self\' data: blob:; object-src \'none\'; base-uri \'none\'; form-action \'none\'; frame-src \'none\'; child-src \'none\'; worker-src \'none\'; manifest-src \'self\'; upgrade-insecure-requests">';
const offlineShell='thisweek.publicPreview.state.v2';
const offlineManifest=JSON.stringify({name:'This Week',scope:'./',start_url:'./?mode=demo'});
const offlineIcon='<svg xmlns="http://www.w3.org/2000/svg"></svg>';
const assetDigests=Object.fromEntries(Object.entries({shell:offlineShell,manifest:offlineManifest,icon:offlineIcon})
  .map(([k,v])=>[k,createHash('sha256').update(v).digest('hex')]));
const offlineWorker="const CACHE_PREFIX='this-week-public-preview-';"+
  "const CACHE_NAME=CACHE_PREFIX+'b"+'b'.repeat(64)+"';"+
  "const EXPECTED_ASSET_SHA256=Object.freeze("+JSON.stringify(assetDigests)+");";
const expectedWorkerSha=createHash('sha256').update(offlineWorker,'utf8').digest('hex');
const canonical=(u)=>{const x=new URL(u);return x.pathname.endsWith('/')?x.pathname:x.pathname};
function transport({mutate=(path,body)=>body,status=()=>200,finalUrl=u=>u,
 bytes=(path,body)=>new TextEncoder().encode(body),
 contentType=path=>path.endsWith('manifest.webmanifest')?'application/manifest+json':
 path.endsWith('.svg')?'image/svg+xml':path.endsWith('.json')?'application/json':
 path.endsWith('.js')?'application/javascript':'text/html'}={}){
 const bodies=new Map(REQUIRED_ASSETS.map(([path,mark])=>[canonical(assetUrl(base,path,sha)),path==='/'?'<title>This Week</title>'+csp+scripts:mark]));
 bodies.set('/Thisweekmvp/release.json',JSON.stringify(manifest()));
 bodies.set('/Thisweekmvp/public-preview/manifest.webmanifest',offlineManifest);
 bodies.set('/Thisweekmvp/public-preview/icon.svg',offlineIcon);
 bodies.set('/Thisweekmvp/public-preview/sw.js',offlineWorker);
 return async u=>{
  const path=new URL(u).pathname;
  const body=mutate(path,bodies.get(path),u);
  return {status:status(path),url:finalUrl(u),type:'basic',redirected:false,
   headers:{get:k=>k==='content-type'?contentType(path,u):null},
   text:async()=>body,
   arrayBuffer:async()=>Uint8Array.from(bytes(path,body,u)).buffer};
 };
}
const run=opts=>verifyOnce({baseUrl:base,expectedSha:sha,config,expectedWorkerSha,fetchImpl:transport(opts)});
test('exact candidate identity, every published route, and script CSP pass', async()=>{
 const result=await run();assert.equal(result.commit,sha);assert.equal(result.checkedAssets,25);assert.equal(result.offlineUrlVariants,2);assert.equal(result.assetDigestCount,3);
});
test('manifest does not accept an unrelated SHA in metadata',()=>{
 const j=manifest();j.commit=old;j.otherNote=sha;assert.throws(()=>verifyManifest(j,sha,config),/commit differs/);
});
test('stale short SHA fails',()=>{const j=manifest();j.shortCommit=old.slice(0,8);assert.throws(()=>verifyManifest(j,sha,config),/Short commit/)});
test('wrong state schema fails',()=>{const j=manifest();j.stateSchema=4;assert.throws(()=>verifyManifest(j,sha,config),/State schema/)});
test('wrong rollback identity fails',()=>{const j=manifest();j.rollbackCommit=old;assert.throws(()=>verifyManifest(j,sha,config),/Rollback commit/)});
test('missing workflow run ID fails',()=>{const j=manifest();j.workflowRunId='';assert.throws(()=>verifyManifest(j,sha,config),/Workflow run/)});
test('HTTP 404 fails rather than reading GitHub error page',async()=>{await assert.rejects(run({status:p=>p.endsWith('/account/')?404:200}),/HTTP 404/)});
test('missing required asset marker fails',async()=>{await assert.rejects(run({mutate:(p,b)=>p.endsWith('/ops/release/app.js')?'not the expected gateway':b}),/route marker/)});
test('malformed JSON fails',async()=>{await assert.rejects(run({mutate:(p,b)=>p.endsWith('release.json')?'{invalid':b}),/invalid JSON/)});
test('content type must be JSON for release manifest',async()=>{await assert.rejects(run({contentType:()=> 'text/html'}),/not JSON/)});
test('redirect to other origin fails',async()=>{await assert.rejects(run({finalUrl:u=>u.replace('bennybundles.github.io','attacker.example')}),/Unexpected response URL/)});
test('CSP keeps the complete audited policy with all restrictions',()=>{
 assert.doesNotThrow(()=>verifyIndexCsp('<title>This Week</title>'+csp+scripts));
});
test('CSP rejects permissive default-src despite strict connect-src',()=>{
 const bad=csp.replace("default-src 'self'","default-src *");
 assert.throws(()=>verifyIndexCsp('<title>This Week</title>'+bad+scripts),
  /CSP directive differs from audited production policy: default-src/);
});
test('CSP rejects network-capable form-action',()=>{
 const bad=csp.replace("form-action 'none'","form-action https:");
 assert.throws(()=>verifyIndexCsp('<title>This Week</title>'+bad+scripts),
  /CSP directive differs from audited production policy: form-action/);
});
test('CSP rejects external base-uri replacement',()=>{
 const bad=csp.replace("base-uri 'none'","base-uri https:");
 assert.throws(()=>verifyIndexCsp('<title>This Week</title>'+bad+scripts),
  /CSP directive differs from audited production policy: base-uri/);
});
test('CSP rejects loosened worker-src, even though connect-src is none',()=>{
 const bad=csp.replace("worker-src 'none'","worker-src 'self'");
 assert.throws(()=>verifyIndexCsp('<title>This Week</title>'+bad+scripts),
  /CSP directive differs from audited production policy: worker-src/);
});
test('CSP rejects externally accessible frame-src and media-src',()=>{
 for(const [a,b,name] of [
   ["frame-src 'none'","frame-src https:",'frame-src'],
   ["media-src 'self' data: blob:","media-src *",'media-src']
 ]){
  assert.throws(()=>verifyIndexCsp('<title>This Week</title>'+csp.replace(a,b)+scripts),
   new RegExp('CSP directive differs from audited production policy: '+name));
 }
});
test('CSP rejects external image destination and script-src-attr bypass',()=>{
 for(const [a,b,name] of [
   ["img-src 'self' data: blob:","img-src *",'img-src'],
   ["script-src-attr 'none'","script-src-attr 'unsafe-inline'",'script-src-attr']
 ]){
  assert.throws(()=>verifyIndexCsp('<title>This Week</title>'+csp.replace(a,b)+scripts),
   new RegExp('CSP directive differs from audited production policy: '+name));
 }
});
test('CSP rejects removed upgrade-insecure-requests directive',()=>{
 const bad=csp.replace('; upgrade-insecure-requests','');
 assert.throws(()=>verifyIndexCsp('<title>This Week</title>'+bad+scripts),
  /CSP directive set differs from audited production policy/);
});
test('CSP rejects meta policy appearing after an executable script',()=>{
 assert.throws(()=>verifyIndexCsp('<title>This Week</title>'+scripts+csp),
  /Production CSP appears after a potentially active resource/);
});
test('CSP rejects unexpected unreviewed directive',()=>{
 const bad=csp.replace('; connect-src','; prefetch-src *; connect-src');
 assert.throws(()=>verifyIndexCsp('<title>This Week</title>'+bad+scripts),
  /CSP directive set differs from audited production policy/);
});
test('CSP rejects an earlier permissive connect-src whose later none is browser-ignored',()=>{
 const altered=csp.replace("connect-src 'none'","connect-src *; connect-src 'none'");
 assert.throws(()=>verifyIndexCsp('<title>This Week</title>'+altered+scripts),
   /Duplicate CSP directive: connect-src/);
});
test('CSP rejects duplicate object-src with earlier permissive content',()=>{
 const altered=csp.replace("object-src 'none'","object-src *; object-src 'none'");
 assert.throws(()=>verifyIndexCsp('<title>This Week</title>'+altered+scripts),
   /Duplicate CSP directive: object-src/);
});
test('CSP rejects case-insensitive duplicate network directives',()=>{
 const altered=csp.replace("connect-src 'none'","CoNnEcT-sRc *; connect-src 'none'");
 assert.throws(()=>verifyIndexCsp('<title>This Week</title>'+altered+scripts),
   /Duplicate CSP directive: connect-src/);
});
test('CSP rejects unapproved remote script host alongside otherwise valid hashes',()=>{
 const altered=csp.replace("script-src 'self'","script-src 'self' https://untrusted.example");
 assert.throws(()=>verifyIndexCsp('<title>This Week</title>'+altered+scripts),
   /no external script sources/);
});
test('CSP rejects wildcard script sources even when inline hashes still match',()=>{
 const altered=csp.replace("script-src 'self'","script-src 'self' *");
 assert.throws(()=>verifyIndexCsp('<title>This Week</title>'+altered+scripts),
   /no external script sources/);
});
test('CSP rejects duplicate meta policies instead of only auditing one',()=>{
 assert.throws(()=>verifyIndexCsp('<title>This Week</title>'+csp+csp+scripts),
   /exactly one production CSP meta policy/);
});
test('CSP rejects connect-src none combined with extra allowed origins',()=>{
 const altered=csp.replace("connect-src 'none'","connect-src 'none' https:");
 assert.throws(()=>verifyIndexCsp('<title>This Week</title>'+altered+scripts),
   /client networking unexpectedly enabled/);
});
test('production CSP cannot permit client networking',()=>{assert.throws(()=>verifyIndexCsp('<title>This Week</title>'+csp.replace("connect-src 'none'","connect-src *")+scripts),/client networking/)});
test('production CSP cannot permit unsafe-inline scripts',()=>{assert.throws(()=>verifyIndexCsp('<title>This Week</title>'+csp.replace("script-src 'self'","script-src 'self' 'unsafe-inline'")+scripts),/Unsafe script/)});
test('script changed without corresponding CSP hash fails',()=>{assert.throws(()=>verifyIndexCsp('<title>This Week</title>'+csp+scripts.replace('const a=1;','const a=999;')),/hashes do not match/)});
test('HTTP credentials and escaping base are rejected',()=>{
 assert.throws(()=>assetUrl('http://example.com/Thisweekmvp/','/',sha),/clean HTTPS/);
 assert.throws(()=>assetUrl('https://bennybundles.github.io/Thisweekmvp/','/../bad',sha),/escaped release base/);
});
test('eventual consistency retry only passes after exact match',async()=>{
 let c=0;const f=transport({mutate:(p,b)=>p.endsWith('release.json')&&c++===0?JSON.stringify({...manifest(),commit:old}):b});
 const result=await auditDeployment({baseUrl:base,expectedSha:sha,config,expectedWorkerSha,fetchImpl:f,attempts:2,delayMs:0,sleep:async()=>{}});
 assert.equal(result.commit,sha);
});
test('persistent release mismatch exhausts bounded retries',async()=>{
 let calls=0;const f=async u=>{calls++;return transport({mutate:(p,b)=>p.endsWith('release.json')?JSON.stringify({...manifest(),commit:old}):b})(u)};
 await assert.rejects(auditDeployment({baseUrl:base,expectedSha:sha,config,expectedWorkerSha,fetchImpl:f,attempts:2,delayMs:0,sleep:async()=>{}}),/after 2 attempt/);
 assert.equal(calls,2);
});

test('CDN serving stale but recognizable offline HTML must block release',async()=>{
 await assert.rejects(run({mutate:(p,b)=>p.endsWith('/public-preview/')?b+'<!-- old shell -->':b}),/Live offline shell does not match/);
});
test('well formed offline webmanifest with a different byte sequence blocks release',async()=>{
 await assert.rejects(run({mutate:(p,b)=>p.endsWith('manifest.webmanifest')?b+' ':b}),/Live offline manifest does not match/);
});
test('correct-looking SVG changed in transit blocks release',async()=>{
 await assert.rejects(run({mutate:(p,b)=>p.endsWith('icon.svg')?b+'\n':b}),/Live offline icon does not match/);
});
test('missing or manually-versioned worker cannot pass live release audit',async()=>{
 await assert.rejects(run({mutate:(p,b)=>p.endsWith('sw.js')?"const CACHE_NAME='v4';":b}),/does not match trusted staged worker SHA-256/);
});
test('maliciously mismatched published worker mapping blocks release',async()=>{
 const forged=offlineWorker.replace(assetDigests.shell,'a'.repeat(64));
 await assert.rejects(run({mutate:(p,b)=>p.endsWith('sw.js')?forged:b}),/does not match trusted staged worker SHA-256/);
});
test('wrong MIME on the published worker fails closed',async()=>{
 await assert.rejects(run({contentType:path=>path.endsWith('sw.js')?'text/html':path.endsWith('.svg')?'image/svg+xml':
 path.endsWith('manifest.webmanifest')?'application/manifest+json':path.endsWith('.json')?'application/json':'text/html'}),/Wrong versioned offline worker MIME/);
});
test('offline worker missing with HTTP 404 prevents release verification',async()=>{
 await assert.rejects(run({status:p=>p.endsWith('sw.js')?404:200}),/HTTP 404/);
});
test('exported verifier directly detects mismatched asset digest',()=>{
 assert.throws(()=>verifyPublishedOfflineAssets({shell:offlineShell+'x',manifest:offlineManifest,icon:offlineIcon,worker:offlineWorker,expectedWorkerSha}),/Live offline shell/);
});


test('served worker with extra executable code fails trusted staged worker attestation',async()=>{
 const altered=offlineWorker+'\nself.addEventListener("fetch",()=>{});';
 await assert.rejects(run({mutate:(p,b)=>p.endsWith('/public-preview/sw.js')?altered:b}),
   /does not match trusted staged worker SHA-256/);
});

test('served worker cannot self-attest a forged digest map with appended code',async()=>{
 const altered=offlineWorker+'\n// valid-looking SHA-256 map above does not authenticate these bytes';
 await assert.rejects(run({mutate:(p,b)=>p.endsWith('/public-preview/sw.js')?altered:b}),
   /does not match trusted staged worker SHA-256/);
});

test('release verification fails closed without independently trusted worker digest',async()=>{
 let called=false;
 await assert.rejects(verifyOnce({baseUrl:base,expectedSha:sha,config,
  fetchImpl:()=>{called=true;throw Error('network should not be called');}}),
  /Trusted staged offline worker SHA-256 is required/);
 assert.equal(called,false);
});

test('malformed trusted worker digests cannot silently disable verification',()=>{
 for(const bad of ['',null,'0'.repeat(63),'z'.repeat(64)]){
  assert.throws(()=>verifyPublishedOfflineAssets({
   shell:offlineShell,manifest:offlineManifest,icon:offlineIcon,worker:offlineWorker,
   expectedWorkerSha:bad}),/Expected trusted staged offline worker SHA-256 is required/);
 }
});

test('an authentic worker and matching local staged worker SHA-256 remain valid',()=>{
 assert.deepEqual(verifyPublishedOfflineAssets({
  shell:offlineShell,manifest:offlineManifest,icon:offlineIcon,worker:offlineWorker,
  expectedWorkerSha}),{assetDigestCount:3});
});

test('uncached worker install URL drift fails even when cache-busted audit probe passes',async()=>{
 await assert.rejects(run({mutate:(path,body,url)=>
  path.endsWith('/public-preview/')&&!new URL(url).searchParams.has('v')
   ? body+'<!-- unversioned stale CDN HTML -->':body}),/Live offline shell does not match/);
});
test('unversioned worker changes must fail independently of cache-busted worker probe',async()=>{
 await assert.rejects(run({mutate:(path,body,url)=>
  path.endsWith('/public-preview/sw.js')&&!new URL(url).searchParams.has('v')
   ? body+'\\n// direct worker drift':body}),/does not match trusted staged worker SHA-256/);
});
test('raw corrupt UTF-8 cannot be silently normalized before byte attestation',async()=>{
 await assert.rejects(run({bytes:(path,body,url)=>
  path.endsWith('manifest.webmanifest')&&!new URL(url).searchParams.has('v')
   ? Uint8Array.from([0x7b,0x22,0x78,0x22,0x3a,0xc3,0x28,0x7d])
   : new TextEncoder().encode(body)}),/Invalid UTF-8/);
});
test('direct unversioned manifest MIME mismatch blocks release despite valid versioned asset',async()=>{
 await assert.rejects(run({contentType:(path,url)=>
  path.endsWith('manifest.webmanifest')&&!new URL(url).searchParams.has('v')
  ? 'text/html' : path.endsWith('manifest.webmanifest')?'application/manifest+json'
   :path.endsWith('.svg')?'image/svg+xml':path.endsWith('.json')?'application/json':
    path.endsWith('.js')?'application/javascript':'text/html'}),/Wrong direct offline manifest MIME/);
});
