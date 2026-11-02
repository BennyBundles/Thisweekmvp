import test from 'node:test';
import assert from 'node:assert/strict';
import {auditDeployment, verifyOnce, verifyManifest, verifyIndexCsp, assetUrl, REQUIRED_ASSETS} from './verify-deployed-release.mjs';
const sha='ab4336e55faf04235d57a5a389c5f816a477c61e';
const old='8913aed99abd1106f346028a74e41acaa2e93bfe';
const base='https://bennybundles.github.io/Thisweekmvp/';
const config={release:'v0.15.0-phase15',rollbackCommit:'351a052ba214d4813b296b4cd3dc7965e695b6e1',rollbackBranch:'rollback/phase15-pre-release-2026-09-18',stateSchema:3,portableSchema:1};
const manifest=()=>({application:'This Week',channel:'production',commit:sha,shortCommit:sha.slice(0,8),release:config.release,rollbackCommit:config.rollbackCommit,rollbackBranch:config.rollbackBranch,stateSchema:3,portableSchema:1,workflowRunId:'12345',deployedAt:'2026-11-02T12:00:00Z'});
const csp='<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\' \'sha256-abc=\' \'sha256-def=\'; connect-src \'none\'; object-src \'none\'">';
const canonical=(u)=>{const x=new URL(u);return x.pathname.endsWith('/')?x.pathname:x.pathname};
function transport({mutate=(path,body)=>body,status=()=>200,finalUrl=u=>u,contentType=path=>path.endsWith('.json')?'application/json':path.endsWith('.js')?'application/javascript':'text/html'}={}){
 const bodies=new Map(REQUIRED_ASSETS.map(([path,mark])=>[canonical(assetUrl(base,path,sha)),path==='/'?'<title>This Week</title>'+csp:mark]));
 bodies.set('/Thisweekmvp/release.json',JSON.stringify(manifest()));
 return async u=>{
  const path=new URL(u).pathname;
  const body=mutate(path,bodies.get(path));
  return {status:status(path),url:finalUrl(u),type:'basic',redirected:false,headers:{get:k=>k==='content-type'?contentType(path):null},text:async()=>body};
 };
}
const run=opts=>verifyOnce({baseUrl:base,expectedSha:sha,config,fetchImpl:transport(opts)});
test('exact candidate identity, every published route, and script CSP pass', async()=>{
 const result=await run();assert.equal(result.commit,sha);assert.equal(result.checkedAssets,18);
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
test('production CSP cannot permit client networking',()=>{assert.throws(()=>verifyIndexCsp('<title>This Week</title>'+csp.replace("connect-src 'none'","connect-src *")),/client networking/)});
test('production CSP cannot permit unsafe-inline scripts',()=>{assert.throws(()=>verifyIndexCsp('<title>This Week</title>'+csp.replace("script-src 'self'","script-src 'self' 'unsafe-inline'")),/Unsafe script/)});
test('HTTP credentials and escaping base are rejected',()=>{
 assert.throws(()=>assetUrl('http://example.com/Thisweekmvp/','/',sha),/clean HTTPS/);
 assert.throws(()=>assetUrl('https://bennybundles.github.io/Thisweekmvp/','/../bad',sha),/escaped release base/);
});
test('eventual consistency retry only passes after exact match',async()=>{
 let c=0;const f=transport({mutate:(p,b)=>p.endsWith('release.json')&&c++===0?JSON.stringify({...manifest(),commit:old}):b});
 const result=await auditDeployment({baseUrl:base,expectedSha:sha,config,fetchImpl:f,attempts:2,delayMs:0,sleep:async()=>{}});
 assert.equal(result.commit,sha);
});
test('persistent release mismatch exhausts bounded retries',async()=>{
 let calls=0;const f=async u=>{calls++;return transport({mutate:(p,b)=>p.endsWith('release.json')?JSON.stringify({...manifest(),commit:old}):b})(u)};
 await assert.rejects(auditDeployment({baseUrl:base,expectedSha:sha,config,fetchImpl:f,attempts:2,delayMs:0,sleep:async()=>{}}),/after 2 attempt/);
 assert.equal(calls,2);
});
