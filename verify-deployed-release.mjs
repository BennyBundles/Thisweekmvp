#!/usr/bin/env node
/**
 * Read-only GitHub Pages release identity verification.
 * No Supabase credentials, provider calls, financial mutations, or writes.
 * Run: node verify-deployed-release.mjs https://bennybundles.github.io/Thisweekmvp/ <full-sha>
 */
import {readFile,lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

const SHA=/^[0-9a-f]{40}$/;
export const REQUIRED_ASSETS=Object.freeze([
  ['/', '<title>This Week</title>'],
  ['/preview.html', 'Public Release Preview'],
  ['/public-preview/?mode=demo', 'thisweek.publicPreview.state.v2'],
  ['/money-lab/', 'Money Sandbox Lab'],
  ['/money-lab/app.js', '/functions/v1/thisweek-money-gateway'],
  ['/account/', 'Account & Security'],
  ['/account/app.js', '/functions/v1/thisweek-account-gateway'],
  ['/account/release-config.js', 'THISWEEK_AUTH_RELEASE_CONFIG'],
  ['/ops/', 'Operations Console'],
  ['/ops/app.js', '/functions/v1/thisweek-ops-gateway'],
  ['/ops/release/', 'Release Evidence'],
  ['/ops/release/app.js', '/functions/v1/thisweek-release-gateway'],
  ['/ops/bootstrap/', 'Staff Bootstrap'],
  ['/ops/bootstrap/app.js', '/functions/v1/thisweek-staff-gateway'],
  ['/support/', 'Support & Disputes'],
  ['/support/app.js', '/functions/v1/thisweek-support-gateway'],
  ['/legal/sandbox/', 'SANDBOX TEST ONLY.'],
]);

function demand(ok, message){if(!ok)throw new Error(message);}

/**
 * The only public routes eligible for release. Keys are server request paths;
 * values are exact file names in the independently staged Pages artifact.
 * Every one of the 20 static routes, plus release.json, is covered.
 */
export const STAGED_ROUTE_FILES=Object.freeze({
  '/':'index.html',
  '/preview.html':'preview.html',
  '/public-preview/':'public-preview/index.html',
  '/public-preview/manifest.webmanifest':'public-preview/manifest.webmanifest',
  '/public-preview/sw.js':'public-preview/sw.js',
  '/public-preview/icon.svg':'public-preview/icon.svg',
  '/money-lab/':'money-lab/index.html',
  '/money-lab/app.js':'money-lab/app.js',
  '/account/':'account/index.html',
  '/account/app.js':'account/app.js',
  '/account/release-config.js':'account/release-config.js',
  '/ops/':'ops/index.html',
  '/ops/app.js':'ops/app.js',
  '/ops/release/':'ops/release/index.html',
  '/ops/release/app.js':'ops/release/app.js',
  '/ops/bootstrap/':'ops/bootstrap/index.html',
  '/ops/bootstrap/app.js':'ops/bootstrap/app.js',
  '/support/':'support/index.html',
  '/support/app.js':'support/app.js',
  '/legal/sandbox/':'legal/sandbox/index.html',
  '/release.json':'release.json'
});
export function requireTrustedRouteDigests(digests){
  demand(digests&&typeof digests==='object'&&!Array.isArray(digests),
    'Independent staged route digests required');
  const expected=Object.keys(STAGED_ROUTE_FILES).sort();
  const actual=Object.keys(digests).sort();
  demand(actual.length===expected.length&&actual.every((path,i)=>path===expected[i]),
    'Staged route digest map must contain exactly the approved public routes');
  for(const path of expected)
    demand(/^[0-9a-f]{64}$/.test(digests[path]||''),
      'Malformed trusted staged route SHA-256 at '+path);
  return digests;
}
export async function loadStagedRouteDigests(siteBase=new URL('./_site/',import.meta.url)){
  const digests=Object.create(null);
  for(const [route,rel] of Object.entries(STAGED_ROUTE_FILES)){
    const file=new URL(rel,siteBase);
    // Never follow symlinked staged paths when establishing trusted build bytes.
    const stat=await lstat(file);
    demand(stat.isFile()&&stat.size>0&&stat.size<=2_000_000,
      'Missing, symlinked, empty or oversized staged route: '+route);
    digests[route]=createHash('sha256').update(await readFile(file)).digest('hex');
  }
  return requireTrustedRouteDigests(digests);
}

export function verifyManifest(json, sha, config){
  demand(SHA.test(sha), 'Expected commit must be a full lowercase SHA-1');
  demand(json && typeof json === 'object' && !Array.isArray(json), 'Manifest must be an object');
  demand(json.application === 'This Week', 'Application identity mismatch');
  demand(json.channel === 'production', 'Nonproduction release manifest');
  demand(json.commit === sha, 'Deployed commit differs from requested commit');
  demand(json.shortCommit === sha.slice(0,8), 'Short commit mismatch');
  demand(json.release === config.release, 'Release name mismatch');
  demand(json.rollbackCommit === config.rollbackCommit, 'Rollback commit mismatch');
  demand(json.rollbackBranch === config.rollbackBranch, 'Rollback branch mismatch');
  demand(json.stateSchema === config.stateSchema, 'State schema mismatch');
  demand(json.portableSchema === config.portableSchema, 'Portable schema mismatch');
  demand(/^\d+$/.test(String(json.workflowRunId||'')), 'Workflow run ID missing');
  demand(!Number.isNaN(Date.parse(json.deployedAt)) && typeof json.deployedAt === 'string', 'Deployment time missing');
  return {commit:json.commit, release:json.release, workflowRunId:String(json.workflowRunId)};
}
export function verifyIndexCsp(html){
  demand(html.includes('<title>This Week</title>'), 'Wrong home page');
  const metas=[...html.matchAll(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/gi)];
  demand(metas.length===1, 'Expected exactly one production CSP meta policy');
  // CSP3: the FIRST occurrence of a repeated directive is enforced; a later
  // "connect-src 'none'" string cannot repair an earlier "connect-src *".
  // Reject duplicates rather than accidentally auditing an ignored directive.
  const directives=new Map();
  for(const part of metas[0][1].split(';')){
    const tokens=part.trim().split(/\s+/).filter(Boolean);
    if(!tokens.length)continue;
    const name=tokens.shift().toLowerCase();
    demand(!directives.has(name), 'Duplicate CSP directive: '+name);
    directives.set(name,tokens);
  }
  const scriptSources=directives.get('script-src')||[];
  demand(!scriptSources.includes("'unsafe-inline'")&&!scriptSources.includes("'unsafe-eval'"),
    'Unsafe script execution policy');
  const hashes=scriptSources.filter(s=>/^'sha256-[A-Za-z0-9+/]+={0,2}'$/.test(s))
    .map(s=>s.slice(8,-1));
  demand(scriptSources.length===3 && scriptSources.includes("'self'") && hashes.length===2,
    'Expected two hashed scripts and no external script sources');
  const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
  demand(scripts.length===2, 'Expected exactly two inline scripts');
  const real=scripts.map(script=>createHash('sha256').update(script,'utf8').digest('base64'));
  demand(real.every(hash=>hashes.includes(hash)), 'CSP script hashes do not match deployed scripts');
  const exactlyNone=name=>{
    const values=directives.get(name);
    return values?.length===1&&values[0]==="'none'";
  };
  demand(exactlyNone('connect-src'), 'Production money/client networking unexpectedly enabled');
  demand(exactlyNone('object-src'), 'Object embedding must be blocked');
  // The demo is intentionally static and has a fixed security policy. Require
  // an exact audited policy rather than accepting a newly widened specialized
  // directive that bypasses default-src's fallback.
  const expected={
    'default-src':["'self'"],
    'script-src-attr':["'none'"],
    'style-src':["'self'","'unsafe-inline'"],
    'img-src':["'self'","data:","blob:"],
    'font-src':["'self'","data:"],
    'media-src':["'self'","data:","blob:"],
    'base-uri':["'none'"],
    'form-action':["'none'"],
    'frame-src':["'none'"],
    'child-src':["'none'"],
    'worker-src':["'none'"],
    'manifest-src':["'self'"],
    'upgrade-insecure-requests':[]
  };
  const allowed=new Set([...Object.keys(expected),'script-src','connect-src','object-src']);
  demand(directives.size===allowed.size&&[...directives.keys()].every(k=>allowed.has(k)),
    'CSP directive set differs from audited production policy');
  for(const [name,tokens] of Object.entries(expected)){
    const actual=directives.get(name);
    demand(Array.isArray(actual)&&actual.length===tokens.length &&
      new Set(actual).size===tokens.length && tokens.every(x=>actual.includes(x)),
      'CSP directive differs from audited production policy: '+name);
  }
  // A meta CSP only becomes effective when the parser reaches it. It cannot
  // retroactively protect scripts, links or other content already parsed.
  const metaAt=html.indexOf(metas[0][0]);
  const earlier=html.slice(0,metaAt);
  demand(!/<(?:script|link|iframe|object|embed)\b/i.test(earlier),
    'Production CSP appears after a potentially active resource');
}

export function assetUrl(base, path, sha, versioned=true){
  const origin=new URL(base);
  demand(origin.protocol==='https:' && !origin.username && !origin.password && !origin.search && !origin.hash, 'Base must be a clean HTTPS URL');
  demand(origin.pathname.endsWith('/'), 'Base must end in /');
  const url=new URL(path.replace(/^\//,''),origin);
  demand(url.origin===origin.origin && url.pathname.startsWith(origin.pathname), 'Asset escaped release base');
  if(versioned)url.searchParams.set('v',sha.slice(0,8));
  return url;
}
export function verifyPublishedOfflineAssets({shell,manifest,icon,worker,workerBytes=worker,expectedWorkerSha}){
  demand(/^[a-f0-9]{64}$/.test(expectedWorkerSha||''), 'Expected trusted staged offline worker SHA-256 is required');
  const observedWorkerSha=createHash('sha256').update(workerBytes).digest('hex');
  demand(observedWorkerSha===expectedWorkerSha, 'Published offline worker does not match trusted staged worker SHA-256');
  const m=worker.match(/const EXPECTED_ASSET_SHA256=Object\.freeze\((\{[^\n]+\})\);/);
  demand(m && m[1], 'Published offline worker has no injected asset SHA-256 digest map');
  let declared;
  try{declared=JSON.parse(m[1])}catch{throw new Error('Published offline worker digest map is not JSON')}
  demand(Object.keys(declared).sort().join(',')==='icon,manifest,shell', 'Offline digest map contains unexpected assets');
  demand(/const CACHE_NAME=CACHE_PREFIX\+'b[a-f0-9]{64}';/.test(worker), 'Published offline worker has no content-addressed cache');
  demand(!worker.includes('const EXPECTED_ASSET_SHA256=null;'), 'Unstamped worker template was published');
  for(const [key,body] of Object.entries({shell,manifest,icon})){
    demand(/^[a-f0-9]{64}$/.test(declared[key]||''), 'Malformed offline SHA-256 for '+key);
    const actual=createHash('sha256').update(body,'utf8').digest('hex');
    demand(actual===declared[key], 'Live offline '+key+' does not match worker digest (possible CDN drift)');
  }
  return {assetDigestCount:3};
}
/**
 * Bound incremental body consumption instead of calling response.arrayBuffer(),
 * which otherwise buffers an arbitrarily large HTTP body before size validation.
 * The underlying stream still controls the size of any individual delivered chunk.
 * Reject missing streaming support rather than silently using an unbounded fallback.
 */
export async function readBoundedResponseBytes(response, maxBytes=2_000_000){
  demand(Number.isSafeInteger(maxBytes)&&maxBytes>0&&maxBytes<=2_000_000,
    'Invalid response-byte limit');
  demand(response?.body&&typeof response.body.getReader==='function',
    'Readable response body required for bounded verification');
  const reader=response.body.getReader();
  const chunks=[];
  let total=0, complete=false;
  try{
    while(true){
      const {value,done}=await reader.read();
      if(done){complete=true;break;}
      demand(value instanceof Uint8Array, 'Non-byte response stream chunk');
      demand(value.byteLength<=maxBytes-total, 'Oversized streamed asset');
      if(value.byteLength){
        chunks.push(Buffer.from(value));
        total+=value.byteLength;
      }
    }
    demand(total>0, 'Empty streamed asset');
    return Buffer.concat(chunks,total);
  }catch(error){
    // Cancellation is best effort; do not wait indefinitely for an adversarial
    // stream to acknowledge cancellation when the security check already failed.
    try{Promise.resolve(reader.cancel()).catch(()=>{});}catch{}
    throw error;
  }finally{
    try{reader.releaseLock();}catch{}
  }
}

export async function verifyOnce({baseUrl,expectedSha,config,expectedWorkerSha,expectedRouteDigests,fetchImpl=fetch}){
  demand(SHA.test(expectedSha), 'Expected commit SHA is invalid');
  demand(/^[a-f0-9]{64}$/.test(expectedWorkerSha||''), 'Trusted staged offline worker SHA-256 is required before fetching');
  const trustedRoutes=requireTrustedRouteDigests(expectedRouteDigests);
  const root=new URL(baseUrl);
  const read=async(path, marker, versioned=true)=>{
    const url=assetUrl(baseUrl,path,expectedSha,versioned);
    const result=await fetchImpl(url.href,{redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(15000)});
    demand(result.status===200, `HTTP ${result.status} at ${path}`);
    demand(result.type!=='opaqueredirect' && !result.redirected, `Redirect at ${path}`);
    demand(new URL(result.url).origin===root.origin && new URL(result.url).pathname===url.pathname, `Unexpected response URL at ${path}`);
    const declaredLength=Number(result.headers.get('content-length')||0);
    demand(Number.isFinite(declaredLength)&&declaredLength>=0&&declaredLength<=2_000_000,
      `Invalid or oversized Content-Length at ${path}`);
    // Read bounded post-content-decoding bytes as the worker would digest.
    // Response.text() is lossy for malformed UTF-8 and cannot prove byte identity.
    const bytes=await readBoundedResponseBytes(result,2_000_000);
    const route=path.split('?')[0];
    demand(Object.hasOwn(STAGED_ROUTE_FILES,route), 'Unapproved live release route: '+route);
    const actualHash=createHash('sha256').update(bytes).digest('hex');
    demand(actualHash===trustedRoutes[route],
      'Live route bytes differ from trusted staged artifact: '+route);
    let body;
    try{body=new TextDecoder('utf-8',{fatal:true}).decode(bytes)}
    catch{throw new Error(`Invalid UTF-8 at ${path}`)}
    if(marker)demand(body.includes(marker), `Missing expected route marker at ${path}`);
    return {body,bytes,contentType:result.headers.get('content-type')||''};
  };
  const manifest=await read('/release.json');
  demand(/\bjson\b/i.test(manifest.contentType), 'Release manifest was not JSON');
  let json;try{json=JSON.parse(manifest.body)}catch{throw new Error('Release manifest is invalid JSON')}
  const receipt=verifyManifest(json,expectedSha,config);
  const home=await read('/',REQUIRED_ASSETS[0][1]);
  verifyIndexCsp(home.body);
  // Sequential fetch avoids large bursts on free Pages hosting.
  let previewShell=null;
  for(const [path,marker] of REQUIRED_ASSETS.slice(1)){
    const value=await read(path,marker);
    if(path==='/public-preview/?mode=demo')previewShell=value;
  }
  // Audit both cache-busted route probes AND the exact unversioned URLs
  // fetched by the installing worker. CDN variants may not share the same bytes.
  const versioned={
    shell:previewShell,
    manifest:await read('/public-preview/manifest.webmanifest'),
    icon:await read('/public-preview/icon.svg'),
    worker:await read('/public-preview/sw.js')
  };
  const direct={
    shell:await read('/public-preview/', 'thisweek.publicPreview.state.v2',false),
    manifest:await read('/public-preview/manifest.webmanifest',null,false),
    icon:await read('/public-preview/icon.svg',null,false),
    worker:await read('/public-preview/sw.js',null,false)
  };
  for(const [kind,assets] of Object.entries({versioned,direct})){
    demand(/^text\/html(?:;|$)/i.test(assets.shell.contentType), 'Wrong '+kind+' offline shell MIME');
    demand(/\b(?:manifest\+json|application\/json)\b/i.test(assets.manifest.contentType), 'Wrong '+kind+' offline manifest MIME');
    demand(/\bimage\/svg\+xml\b/i.test(assets.icon.contentType), 'Wrong '+kind+' offline icon MIME');
    demand(/\b(?:javascript|ecmascript)\b/i.test(assets.worker.contentType), 'Wrong '+kind+' offline worker MIME');
    verifyPublishedOfflineAssets({
      shell:assets.shell.bytes,manifest:assets.manifest.bytes,icon:assets.icon.bytes,
      worker:assets.worker.body,workerBytes:assets.worker.bytes,expectedWorkerSha
    });
  }
  return {...receipt, checkedAssets:REQUIRED_ASSETS.length+8,
    exactRouteDigests:Object.keys(trustedRoutes).length, assetDigestCount:3,
    offlineUrlVariants:2, origin:root.origin};
}
export async function auditDeployment({baseUrl,expectedSha,config,expectedWorkerSha,expectedRouteDigests,fetchImpl=fetch,attempts=3,delayMs=1000,sleep=ms=>new Promise(r=>setTimeout(r,ms))}){
  demand(Number.isInteger(attempts)&&attempts>=1&&attempts<=12,'Invalid retry count');
  let last;
  for(let attempt=1;attempt<=attempts;attempt++){
    try{return await verifyOnce({baseUrl,expectedSha,config,expectedWorkerSha,expectedRouteDigests,fetchImpl})}
    catch(error){last=error;if(attempt<attempts)await sleep(delayMs)}
  }
  throw new Error(`Release verification failed after ${attempts} attempt(s): ${last?.message}`);
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  const [baseUrl,expectedSha]=process.argv.slice(2);
  const cfg=JSON.parse(await readFile(new URL('./release.config.json',import.meta.url),'utf8'));
  try{
    demand(baseUrl&&expectedSha, 'Usage: node verify-deployed-release.mjs <base-url> <40-character-sha>');
    // Local artifact is generated and stamp-verified in the same protected deploy job.
    // Never trust a worker-provided digest map as its own authenticity evidence.
    const stagedWorker=await readFile(new URL('./_site/public-preview/sw.js',import.meta.url));
    const expectedWorkerSha=createHash('sha256').update(stagedWorker).digest('hex');
    const expectedRouteDigests=await loadStagedRouteDigests();
    demand(expectedRouteDigests['/public-preview/sw.js']===expectedWorkerSha,
      'Trusted worker SHA differs from staged all-route manifest');
    const outcome=await auditDeployment({baseUrl,expectedSha,config:cfg,expectedWorkerSha,
      expectedRouteDigests,attempts:12,delayMs:5000});
    process.stdout.write('Validated exact This Week Pages release: '+JSON.stringify(outcome)+'\n');
  }catch(e){console.error('FAIL CLOSED:',e.message);process.exitCode=1}
}
