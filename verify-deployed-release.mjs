#!/usr/bin/env node
/**
 * Read-only GitHub Pages release identity verification.
 * No Supabase credentials, provider calls, financial mutations, or writes.
 * Run: node verify-deployed-release.mjs https://bennybundles.github.io/Thisweekmvp/ <full-sha>
 */
import {readFile} from 'node:fs/promises';
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
  const policy=html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i)?.[1];
  demand(Boolean(policy), 'Missing production CSP');
  const source=policy.split(';').map(s=>s.trim()).find(s=>s.startsWith('script-src ')) || '';
  demand(source.includes("'self'") && (source.match(/'sha256-[^']+'/g)||[]).length===2, 'Expected two hashed scripts');
  demand(!source.includes('unsafe-inline') && !source.includes('unsafe-eval'), 'Unsafe script execution policy');
  demand(/(?:^|;)\s*connect-src 'none'(?:;|$)/.test(policy), 'Production money/client networking unexpectedly enabled');
  demand(/(?:^|;)\s*object-src 'none'(?:;|$)/.test(policy), 'Object embedding must be blocked');
}
export function assetUrl(base, path, sha){
  const origin=new URL(base);
  demand(origin.protocol==='https:' && !origin.username && !origin.password && !origin.search && !origin.hash, 'Base must be a clean HTTPS URL');
  demand(origin.pathname.endsWith('/'), 'Base must end in /');
  const url=new URL(path.replace(/^\//,''),origin);
  demand(url.origin===origin.origin && url.pathname.startsWith(origin.pathname), 'Asset escaped release base');
  url.searchParams.set('v',sha.slice(0,8));
  return url;
}
export async function verifyOnce({baseUrl,expectedSha,config,fetchImpl=fetch}){
  demand(SHA.test(expectedSha), 'Expected commit SHA is invalid');
  const root=new URL(baseUrl);
  const read=async(path, marker)=>{
    const url=assetUrl(baseUrl,path,expectedSha);
    const result=await fetchImpl(url.href,{redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(15000)});
    demand(result.status===200, `HTTP ${result.status} at ${path}`);
    demand(result.type!=='opaqueredirect' && !result.redirected, `Redirect at ${path}`);
    demand(new URL(result.url).origin===root.origin && new URL(result.url).pathname===url.pathname, `Unexpected response URL at ${path}`);
    const declaredLength=Number(result.headers.get('content-length')||0);
    demand(declaredLength<=2_000_000, `Asset too large at ${path}`);
    const body=await result.text();
    demand(body.length>0 && body.length<=2_000_000, `Empty or oversized asset at ${path}`);
    if(marker)demand(body.includes(marker), `Missing expected route marker at ${path}`);
    return {body,contentType:result.headers.get('content-type')||''};
  };
  const manifest=await read('/release.json');
  demand(/\bjson\b/i.test(manifest.contentType), 'Release manifest was not JSON');
  let json;try{json=JSON.parse(manifest.body)}catch{throw new Error('Release manifest is invalid JSON')}
  const receipt=verifyManifest(json,expectedSha,config);
  const home=await read('/',REQUIRED_ASSETS[0][1]);
  verifyIndexCsp(home.body);
  // Sequential fetch avoids large bursts on free Pages hosting.
  for(const [path,marker] of REQUIRED_ASSETS.slice(1)) await read(path,marker);
  return {...receipt, checkedAssets:REQUIRED_ASSETS.length+1, origin:root.origin};
}
export async function auditDeployment({baseUrl,expectedSha,config,fetchImpl=fetch,attempts=3,delayMs=1000,sleep=ms=>new Promise(r=>setTimeout(r,ms))}){
  demand(Number.isInteger(attempts)&&attempts>=1&&attempts<=12,'Invalid retry count');
  let last;
  for(let attempt=1;attempt<=attempts;attempt++){
    try{return await verifyOnce({baseUrl,expectedSha,config,fetchImpl})}
    catch(error){last=error;if(attempt<attempts)await sleep(delayMs)}
  }
  throw new Error(`Release verification failed after ${attempts} attempt(s): ${last?.message}`);
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  const [baseUrl,expectedSha]=process.argv.slice(2);
  const cfg=JSON.parse(await readFile(new URL('./release.config.json',import.meta.url),'utf8'));
  try{
    demand(baseUrl&&expectedSha, 'Usage: node verify-deployed-release.mjs <base-url> <40-character-sha>');
    const outcome=await auditDeployment({baseUrl,expectedSha,config:cfg,attempts:12,delayMs:5000});
    process.stdout.write('Validated exact This Week Pages release: '+JSON.stringify(outcome)+'\n');
  }catch(e){console.error('FAIL CLOSED:',e.message);process.exitCode=1}
}
