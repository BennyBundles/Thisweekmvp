import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const prep=fs.readFileSync(new URL('./prepare-public-preview.mjs',import.meta.url),'utf8');
const sw=fs.readFileSync(new URL('./public-preview-sw.js',import.meta.url),'utf8');
const check=fs.readFileSync(new URL('./public-preview-check.mjs',import.meta.url),'utf8');
test('the preview displays a real status rather than silently discarding registration errors',()=>{
  for(const needle of ['thisweek-offline-readiness','Offline not ready:','offlineSetStatus','checkPublicOfflineReadiness','controllerchange'])assert.ok(prep.includes(needle),needle);
  assert.ok(!prep.includes("register('./sw.js',{scope:'./'}).catch(()=>{})"));
});
test('installed and controlling are separate acceptance checks',()=>{
  for(const needle of ['navigator.serviceWorker.ready','navigator.serviceWorker.controller','NOT_CONTROLLING','inspectOfflineWorker'])assert.ok(prep.includes(needle),needle);
  assert.ok(prep.includes("scope:'./'"));
});
test('offline badge only says ready after active worker confirms verified cache contents',()=>{
  assert.ok(prep.indexOf('const answer=await inspectOfflineWorker();')<prep.indexOf("offlineSetStatus('ready'"));
  assert.match(prep,/if\(!answer\.ready\|\|answer\.scope!==expectedScope\)/);
  assert.match(sw,/await validShell/);
  assert.match(sw,/await validator\(response,url\)/);
});
test('worker status has no private Plan data and cannot be forged by nonmatching messages',()=>{
  assert.ok(sw.includes("event.data?.type!=='THISWEEK_OFFLINE_CHECK'"));
  assert.ok(sw.includes("port.postMessage({type:'THISWEEK_OFFLINE_STATUS'"));
  assert.ok(!sw.includes("port.postMessage({userId"));
});
test('build requires readiness diagnostics before preview publication',()=>{
  for(const needle of ['offline readiness status panel','offline controller check','surfaced offline setup error'])assert.ok(check.includes(needle),needle);
});
