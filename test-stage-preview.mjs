import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const script=fileURLToPath(new URL('./stage-preview.mjs',import.meta.url));
const assetSources=[
  'preview.html','public-preview-manifest.webmanifest','public-preview-sw.js',
  'public-preview-icon.svg','money-lab/index.html','money-lab/app.js',
  'account/index.html','account/app.js','account/release-config.js',
  'ops/index.html','ops/app.js','ops/release/index.html','ops/release/app.js',
  'ops/bootstrap/index.html','ops/bootstrap/app.js','support/index.html','support/app.js',
  'legal/sandbox/index.html','index.html'
];
function fixture(){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'thisweek-static-preview-'));
  for(const rel of assetSources){
    const file=path.join(root,rel);fs.mkdirSync(path.dirname(file),{recursive:true});
    fs.writeFileSync(file,'fixture '+rel);
  }
  // Artifact stamping is mandatory even in isolated fixture builds.
  fs.copyFileSync(fileURLToPath(new URL('./stamp-preview-service-worker.mjs',import.meta.url)),
    path.join(root,'stamp-preview-service-worker.mjs'));
  fs.writeFileSync(path.join(root,'public-preview-sw.js'),
    "const CACHE_PREFIX='this-week-public-preview-';\nconst CACHE_NAME=CACHE_PREFIX+'v4';\nconst EXPECTED_ASSET_SHA256=null;\n");
  const mock=`import fs from 'node:fs';import path from 'node:path';
const [src,dst]=process.argv.slice(2);
fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(src,dst);`;
  for(const name of ['prepare-site.mjs','prepare-public-preview.mjs'])
    fs.writeFileSync(path.join(root,name),mock);
  // The isolated builder fixture uses synthetic HTML. Test the real CSP
  // validator independently and require this hook's execution here.
  fs.writeFileSync(path.join(root,'verify-production-csp.mjs'),'process.exit(0);');
  for(const name of ['public-preview-check.mjs','money-lab-check.mjs',
    'account-check.mjs','ops-check.mjs','phase34-check.mjs','phase34c-check.mjs',
    'support-check.mjs','legal-check.mjs'])
    fs.writeFileSync(path.join(root,name),'process.exit(0);');
  return root;
}
function run(root,vars={}){
  return spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8',
    env:{...process.env,VERCEL_ENV:'preview',...vars}});
}
function within(callback){
  const root=fixture();try{callback(root);}finally{fs.rmSync(root,{recursive:true,force:true});}
}
test('stages 20 hash-identified preview assets with no production manifest',()=>within(root=>{
  const r=run(root);assert.equal(r.status,0,r.stderr);
  const out=path.join(root,'_site'),data=JSON.parse(fs.readFileSync(path.join(out,'preview-build.json'),'utf8'));
  assert.equal(data.channel,'preview');assert.equal(Object.keys(data.assets).length,20);
  assert.equal(fs.existsSync(path.join(out,'release.json')),false);
  assert.equal(fs.existsSync(path.join(out,'ops/release/app.js')),true);
}));
test('staging fails closed when production CSP preflight rejects an artifact',()=>within(root=>{
  fs.writeFileSync(path.join(root,'verify-production-csp.mjs'),
    "console.error('CSP_PREFLIGHT_REJECTED');process.exit(1);");
  const r=run(root);
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/CSP_PREFLIGHT_REJECTED/);
  assert.match(r.stderr,/verify-production-csp.mjs failed/);
}));
test('required source missing fails without deleting prior output',()=>within(root=>{
  fs.rmSync(path.join(root,'account/app.js'));
  fs.mkdirSync(path.join(root,'_site'));fs.writeFileSync(path.join(root,'_site/keep'),'preserved');
  const r=run(root);assert.notEqual(r.status,0);assert.match(r.stderr,/Required source missing/);
  assert.equal(fs.readFileSync(path.join(root,'_site/keep'),'utf8'),'preserved');
}));
test('production environment fails closed',()=>within(root=>{
  const r=run(root,{VERCEL_ENV:'production'});
  assert.notEqual(r.status,0);assert.match(r.stderr,/Production is owned by GitHub Pages/);
  assert.equal(fs.existsSync(path.join(root,'_site')),false);
}));
test('exact source SHA and branch are recorded without invention',()=>within(root=>{
  const sha='a'.repeat(40),r=run(root,{VERCEL_GIT_COMMIT_SHA:sha,VERCEL_GIT_COMMIT_REF:'review/phase37'});
  assert.equal(r.status,0,r.stderr);
  const data=JSON.parse(fs.readFileSync(path.join(root,'_site/preview-build.json'),'utf8'));
  assert.equal(data.sourceCommit,sha);assert.equal(data.sourceBranch,'review/phase37');
  assert.match(data.assets['index.html'],/^[0-9a-f]{64}$/);
}));
test('invalid source SHA remains null and cannot attest a commit',()=>within(root=>{
  const r=run(root,{VERCEL_GIT_COMMIT_SHA:'short-sha'});assert.equal(r.status,0,r.stderr);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root,'_site/preview-build.json'),'utf8')).sourceCommit,null);
}));

test('missing mandatory route validator rejects build and preserves prior output',()=>within(root=>{
  fs.rmSync(path.join(root,'public-preview-check.mjs'));
  fs.mkdirSync(path.join(root,'_site'));
  fs.writeFileSync(path.join(root,'_site/keep'),'previous preview');
  const r=run(root);
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/Required source missing: public-preview-check.mjs/);
  assert.equal(fs.readFileSync(path.join(root,'_site/keep'),'utf8'),'previous preview');
}));
test('actual staged route validator failure rejects build',()=>within(root=>{
  fs.writeFileSync(path.join(root,'public-preview-check.mjs'),
    "console.error('BROKEN_SIBLING_LINK');process.exit(1);");
  const r=run(root);
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/BROKEN_SIBLING_LINK/);
  assert.match(r.stderr,/public-preview-check.mjs failed/);
}));


test('staged PWA worker cache identity matches exact staged assets',()=>within(root=>{
  const r=run(root);assert.equal(r.status,0,r.stderr);
  const built=fs.readFileSync(path.join(root,'_site/public-preview/sw.js'),'utf8');
  assert.match(built,/CACHE_NAME=CACHE_PREFIX\+'b[a-f0-9]{64}'/);
  assert.doesNotMatch(built,/CACHE_NAME=CACHE_PREFIX\+'v4'/);
  const check=spawnSync(process.execPath,[path.join(root,'stamp-preview-service-worker.mjs'),'--verify',
    path.join(root,'_site/public-preview/index.html'),
    path.join(root,'_site/public-preview/manifest.webmanifest'),
    path.join(root,'_site/public-preview/icon.svg'),
    path.join(root,'public-preview-sw.js'),
    path.join(root,'_site/public-preview/sw.js')],{cwd:root,encoding:'utf8'});
  assert.equal(check.status,0,check.stderr);
}));

test('staged PWA fingerprint changes after a different shell build',()=>within(root=>{
  const first=run(root);assert.equal(first.status,0,first.stderr);
  const prior=fs.readFileSync(path.join(root,'_site/public-preview/sw.js'),'utf8');
  fs.writeFileSync(path.join(root,'index.html'),'updated fixture source');
  const second=run(root);assert.equal(second.status,0,second.stderr);
  const after=fs.readFileSync(path.join(root,'_site/public-preview/sw.js'),'utf8');
  assert.notEqual(after,prior);
}));


const buildArtifacts=root=>fs.readdirSync(root)
  .filter(name=>name.startsWith('.thisweek-preview-rollback-'));
test('late route-validation failure restores previous preview byte-for-byte',()=>within(root=>{
  const site=path.join(root,'_site');
  fs.mkdirSync(site);fs.writeFileSync(path.join(site,'old-preview'),'previous verified bytes');
  const previous=fs.readFileSync(path.join(site,'old-preview'));
  fs.writeFileSync(path.join(root,'public-preview-check.mjs'),
    "console.error('LATE_ROUTE_FAILURE');process.exit(1);");
  const r=run(root);
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/LATE_ROUTE_FAILURE/);
  assert.deepEqual(fs.readFileSync(path.join(site,'old-preview')),previous);
  assert.deepEqual(fs.readdirSync(site),['old-preview']);
  assert.equal(fs.existsSync(path.join(root,'.thisweek-preview-build.lock')),false);
  assert.deepEqual(buildArtifacts(root),[]);
}));
test('late validation failure with no existing preview removes all partial build output',()=>within(root=>{
  const site=path.join(root,'_site');
  fs.writeFileSync(path.join(root,'legal-check.mjs'),
    "console.error('FINAL_VALIDATOR_FAILURE');process.exit(1);");
  const r=run(root);
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/FINAL_VALIDATOR_FAILURE/);
  assert.equal(fs.existsSync(site),false);
  assert.equal(fs.existsSync(path.join(root,'.thisweek-preview-build.lock')),false);
  assert.deepEqual(buildArtifacts(root),[]);
}));
test('a verified previous build survives a later failed rebuild unchanged',()=>within(root=>{
  const site=path.join(root,'_site');
  const good=run(root,{VERCEL_GIT_COMMIT_SHA:'b'.repeat(40)});
  assert.equal(good.status,0,good.stderr);
  const manifest=fs.readFileSync(path.join(site,'preview-build.json'));
  const worker=fs.readFileSync(path.join(site,'public-preview/sw.js'));
  fs.writeFileSync(path.join(root,'money-lab-check.mjs'),
    "console.error('FAILED_REBUILD');process.exit(1);");
  const broken=run(root);
  assert.notEqual(broken.status,0);
  assert.deepEqual(fs.readFileSync(path.join(site,'preview-build.json')),manifest);
  assert.deepEqual(fs.readFileSync(path.join(site,'public-preview/sw.js')),worker);
  assert.deepEqual(buildArtifacts(root),[]);
}));
test('successful rebuild removes old artifacts and rollback directory',()=>within(root=>{
  const site=path.join(root,'_site');
  fs.mkdirSync(site);fs.writeFileSync(path.join(site,'obsolete'),'old data');
  const r=run(root);
  assert.equal(r.status,0,r.stderr);
  assert.equal(fs.existsSync(path.join(site,'obsolete')),false);
  assert.ok(fs.statSync(path.join(site,'preview-build.json')).size>0);
  assert.equal(fs.existsSync(path.join(root,'.thisweek-preview-build.lock')),false);
  assert.deepEqual(buildArtifacts(root),[]);
}));
test('exclusive build lock rejects overlapping writers without altering artifact',()=>within(root=>{
  const site=path.join(root,'_site');fs.mkdirSync(site);
  fs.writeFileSync(path.join(site,'keep'),'original');
  fs.writeFileSync(path.join(root,'.thisweek-preview-build.lock'),'another builder');
  const r=run(root);
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/EEXIST/);
  assert.equal(fs.readFileSync(path.join(site,'keep'),'utf8'),'original');
  assert.equal(fs.readFileSync(path.join(root,'.thisweek-preview-build.lock'),'utf8'),'another builder');
  assert.deepEqual(buildArtifacts(root),[]);
}));
test('preview builder rejects symlink artifact output without following it',()=>within(root=>{
  const intended=path.join(root,'external-store');
  fs.mkdirSync(intended);fs.writeFileSync(path.join(intended,'sentinel'),'untouched');
  fs.symlinkSync(intended,path.join(root,'_site'));
  const r=run(root);
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/Unsafe existing preview output/);
  assert.equal(fs.readFileSync(path.join(intended,'sentinel'),'utf8'),'untouched');
  assert.equal(fs.lstatSync(path.join(root,'_site')).isSymbolicLink(),true);
  assert.equal(fs.existsSync(path.join(root,'.thisweek-preview-build.lock')),false);
}));
