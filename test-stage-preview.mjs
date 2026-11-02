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
  const mock=`import fs from 'node:fs';import path from 'node:path';
const [src,dst]=process.argv.slice(2);
fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(src,dst);`;
  for(const name of ['prepare-site.mjs','prepare-public-preview.mjs'])
    fs.writeFileSync(path.join(root,name),mock);
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

test('rejects a staged preview when an actual route validator fails',()=>within(root=>{
  fs.writeFileSync(path.join(root,'public-preview-check.mjs'),"console.error('BROKEN_SIBLING_LINK');process.exit(1);");
  const r=run(root);
  assert.notEqual(r.status,0);assert.match(r.stderr,/BROKEN_SIBLING_LINK/);
  assert.match(r.stderr,/public-preview-check.mjs failed/);
}));
