import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('.',import.meta.url));
const site=path.join(root,'_site');
const sha='a'.repeat(40); // Synthetic test identity, never a public release.
const runId='530054';
const PUBLIC_FILES=Object.freeze([
  'index.html','preview.html',
  'public-preview/index.html',
  'public-preview/manifest.webmanifest','public-preview/sw.js','public-preview/icon.svg',
  'money-lab/index.html','money-lab/app.js',
  'account/index.html','account/app.js','account/release-config.js',
  'ops/index.html','ops/app.js','ops/release/index.html','ops/release/app.js',
  'ops/bootstrap/index.html','ops/bootstrap/app.js',
  'support/index.html','support/app.js','legal/sandbox/index.html'
]);
const sha256=b=>createHash('sha256').update(b).digest('hex');

function run(command,args,env){
  const result=spawnSync(command,args,{
    cwd:root,env:{...process.env,...env},encoding:'utf8',
    maxBuffer:16*1024*1024,timeout:120000
  });
  assert.equal(result.status,0,
    command+' failed: '+(result.error?.message||result.signal||'exit '+result.status)+
    '\nstdout:\n'+String(result.stdout).slice(-3500)+
    '\nstderr:\n'+String(result.stderr).slice(-3500));
}
function stagePreview(){
  run(process.execPath,['stage-preview.mjs'],{
    VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_SHA:sha,
    VERCEL_GIT_COMMIT_REF:'phase54-synthetic-qa'
  });
}
function productionStageScript(){
  const source=fs.readFileSync(path.join(root,'.github/workflows/pages.yml'),'utf8');
  const begin='      - name: Stage production site\n';
  const end='\n      - name: Setup Pages\n';
  assert.equal(source.split(begin).length,2,'exactly one Pages staging step required');
  const tail=source.split(begin)[1];
  assert.equal(tail.split(end).length,2,'exactly one Pages step boundary required');
  const section=tail.split(end)[0];
  const marker='        run: |\n';
  assert.equal(section.split(marker).length,2,'must extract the real production run block');
  const lines=section.split(marker)[1].split('\n');
  const script=lines.map((line,index)=>{
    if(line==='')return '';
    assert.ok(line.startsWith('          '),
      'unexpected indentation in production command at line '+index);
    return line.slice(10);
  }).join('\n');
  assert.match(script,/node prepare-site\.mjs index\.html _site\/index\.html/);
  assert.match(script,/stamp-preview-service-worker\.mjs --verify/);
  assert.match(script,/release\.json/);
  assert.doesNotMatch(script,/\$\{\{/,'unexpanded Actions expressions in staging block');
  return script;
}
function filesIn(directory,prefix=''){
  const found=[];
  for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
    const rel=prefix?prefix+'/'+entry.name:entry.name;
    const full=path.join(directory,entry.name);
    if(entry.isDirectory())found.push(...filesIn(full,rel));
    else{
      assert.ok(entry.isFile(),'unexpected symlink or special public output: '+rel);
      found.push(rel);
    }
  }
  return found;
}
function snapshot(){
  return new Map(filesIn(site).map(rel=>[rel,fs.readFileSync(path.join(site,rel))]));
}
function receipt(map,name){return JSON.parse(map.get(name)?.toString('utf8')||'null');}
function parityFailures(preview,production){
  const issues=[];
  const expected=new Set(PUBLIC_FILES);
  for(const rel of PUBLIC_FILES){
    if(!preview.has(rel))issues.push('preview missing: '+rel);
    if(!production.has(rel))issues.push('production missing: '+rel);
    if(preview.has(rel)&&production.has(rel)&&
       !preview.get(rel).equals(production.get(rel)))
      issues.push('different deployed bytes: '+rel);
  }
  for(const path of preview.keys()){
    if(!expected.has(path)&&path!=='preview-build.json')
      issues.push('unapproved Vercel output: '+path);
  }
  for(const path of production.keys()){
    if(!expected.has(path)&&path!=='release.json'&&path!=='.nojekyll')
      issues.push('unapproved GitHub Pages output: '+path);
  }
  if(!preview.has('preview-build.json'))issues.push('missing preview receipt');
  if(preview.has('release.json'))issues.push('production receipt leaked to preview');
  if(!production.has('release.json'))issues.push('missing production receipt');
  if(production.has('preview-build.json'))issues.push('preview receipt leaked to production');
  return issues;
}

test('parity audit rejects stale, missing and extra public assets',()=>{
  const a=new Map(PUBLIC_FILES.map(name=>[name,Buffer.from('known')]));
  a.set('preview-build.json',Buffer.from('{}'));
  const b=new Map(PUBLIC_FILES.map(name=>[name,Buffer.from('known')]));
  b.set('release.json',Buffer.from('{}'));
  b.set('.nojekyll',Buffer.alloc(0));
  assert.deepEqual(parityFailures(a,b),[]);
  b.set('public-preview/sw.js',Buffer.from('old offline worker'));
  assert.match(parityFailures(a,b).join(' '),/different deployed bytes: public-preview\/sw.js/);
  b.delete('public-preview/sw.js');
  assert.match(parityFailures(a,b).join(' '),/production missing: public-preview\/sw.js/);
  b.set('leaked-private.env',Buffer.from('secret'));
  assert.match(parityFailures(a,b).join(' '),/unapproved GitHub Pages output: leaked-private.env/);
});

test('actual Vercel and GitHub Pages staging yield identical bytes for every public route',()=>{
  try{
    stagePreview();
    const preview=snapshot();
    const previewManifest=receipt(preview,'preview-build.json');
    assert.equal(previewManifest?.channel,'preview');
    assert.equal(previewManifest?.sourceCommit,sha);
    assert.deepEqual(Object.keys(previewManifest.assets||{}).sort(),[...PUBLIC_FILES].sort(),
      'Preview manifest must bind every approved static route');
    for(const rel of PUBLIC_FILES){
      assert.ok(preview.get(rel)?.length>0,'missing or empty Vercel route '+rel);
      assert.equal(previewManifest.assets[rel],sha256(preview.get(rel)),
        'Vercel manifest has an incorrect byte digest: '+rel);
    }
    run('bash',['-e','-o','pipefail','-c',productionStageScript()],{
      RELEASE_SHA:sha,RELEASE_RUN_ID:runId,VERCEL_ENV:''
    });
    const pages=snapshot();
    assert.deepEqual(parityFailures(preview,pages),[],
      'Do not publish a different route or asset set to Pages vs Vercel');
    const release=receipt(pages,'release.json');
    assert.equal(release?.application,'This Week');
    assert.equal(release?.channel,'production');
    assert.equal(release?.commit,sha);
    assert.equal(String(release?.workflowRunId),runId);
  }finally{
    // Leave the CI checkout in preview-only state; never retain a synthetic
    // production manifest in a PR validation job.
    stagePreview();
    assert.equal(fs.existsSync(path.join(site,'release.json')),false);
    assert.equal(fs.existsSync(path.join(site,'preview-build.json')),true);
  }
});
