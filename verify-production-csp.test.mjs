import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('.',import.meta.url));
const cspCli=path.join(root,'verify-production-csp.mjs');
const prepare=path.join(root,'prepare-site.mjs');
const source=path.join(root,'index.html');
function withStaged(run){
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'thisweek-csp-preflight-'));
  const staged=path.join(tmp,'index.html');
  try{
    const result=spawnSync(process.execPath,[prepare,source,staged],{encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);
    return run(staged);
  }finally{fs.rmSync(tmp,{recursive:true,force:true});}
}
function check(file){return spawnSync(process.execPath,[cspCli,file],{encoding:'utf8'});}
function modify(file,from,to){
  const s=fs.readFileSync(file,'utf8');
  assert.ok(s.includes(from),'Expected source fixture not found: '+from);
  fs.writeFileSync(file,s.replace(from,to));
}
test('real staged production HTML passes the independently invoked CSP gate',()=>{
  withStaged(file=>{
    const r=check(file);
    assert.equal(r.status,0,r.stderr);
    assert.match(r.stdout,/Staged production CSP verified/);
  });
});
test('staged HTML with loosened frame-src fails before a deploy is eligible',()=>{
  withStaged(file=>{
    modify(file,"frame-src 'none'","frame-src https:");
    const r=check(file);
    assert.notEqual(r.status,0);
    assert.match(r.stderr,/CSP directive differs from audited production policy: frame-src/);
  });
});
test('a stale permissive duplicate connect-src fails on the actual staged file',()=>{
  withStaged(file=>{
    modify(file,"connect-src 'none'","connect-src *; connect-src 'none'");
    const r=check(file);
    assert.notEqual(r.status,0);
    assert.match(r.stderr,/Duplicate CSP directive: connect-src/);
  });
});
test('CSP that appears after a script fails even if its own text is correct',()=>{
  withStaged(file=>{
    const html=fs.readFileSync(file,'utf8');
    const originalScript=html.match(/<script[^>]*>[\s\S]*?<\/script>/i)?.[0];
    assert.ok(originalScript,'expected existing script in staged HTML');
    const moved=html.replace(originalScript,'').replace(
      '<meta http-equiv="Content-Security-Policy"',
      originalScript+'<meta http-equiv="Content-Security-Policy"');
    fs.writeFileSync(file,moved);
    const r=check(file);
    assert.notEqual(r.status,0);
    assert.match(r.stderr,/Production CSP appears after a potentially active resource/);
  });
});
test('missing or empty staged HTML fails closed',()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'thisweek-csp-failure-'));
  try{
    const missing=check(path.join(tmp,'missing.html'));
    assert.notEqual(missing.status,0);
    const empty=path.join(tmp,'empty.html');
    fs.writeFileSync(empty,'');
    const bad=check(empty);
    assert.notEqual(bad.status,0);
    assert.match(bad.stderr,/Empty or oversized staged production HTML/);
  }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
