import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const w=read('.github/workflows/pages.yml'), smoke=read('release-smoke-check.mjs');
const preview=read('stage-preview.mjs'), ptest=read('test-stage-preview.mjs');
const sw=read('public-preview-sw.js'), shell=read('index.html');
const prep=read('prepare-public-preview.mjs'), vp=read('public-preview-check.mjs');
test('full dependency stack Phase35–42 executes in PR validation',()=>{
 for(const name of ['verify-deployed-release.test.mjs','phase36-data-durability.test.mjs',
  'phase36-backup-security.test.mjs','phase44-multitab-durability.test.mjs','phase37-verified-restore.test.mjs',
  'phase38-secure-export.test.mjs','test-stage-preview.mjs',
  'phase41-pages-queue.test.mjs','public-preview-sw.test.mjs',
  'phase43-integration.test.mjs']){
  assert.ok(w.includes('node --test '+name),name);
 }
});
test('preview artifact actually runs route validators, not only asset existence',()=>{
 assert.match(preview,/for\(const \[script,\.\.\.args\] of validators\)call\(script,\.\.\.args\)/);
 for(const name of ['public-preview-check.mjs','money-lab-check.mjs','account-check.mjs','ops-check.mjs','phase34-check.mjs','phase34c-check.mjs','support-check.mjs','legal-check.mjs']){
  assert.ok(preview.includes(name),name);
 }
 assert.match(ptest,/actual staged route validator failure rejects build/);
 assert.match(ptest,/missing mandatory route validator rejects build/);
});
test('no Vercel production publication and no production artifact in preview',()=>{
 assert.match(preview,/VERCEL_ENV==='production'/);
 assert.match(preview,/Production is owned by GitHub Pages/);
 assert.match(preview,/fs\.existsSync\(path\.join\(out,'release.json'\)\)/);
 assert.match(preview,/preview-build\.json/);
});
test('main only deployment: PR checks cannot release or cancel production',()=>{
 assert.match(w,/github\.ref == 'refs\/heads\/main' && \(github\.event_name == 'push' \|\| github\.event_name == 'workflow_dispatch'\)/);
 assert.match(w,/group: thisweek-pages-production-deploy/);
 assert.match(w,/cancel-in-progress: false\s*\n\s*queue: max/);
 assert.match(w,/format\('pages-run-\{0\}', github\.run_id\)/);
 assert.match(w,/git ls-remote --exit-code origin refs\/heads\/main/);
 assert.match(smoke,/main/);
});
test('release and financial lock remain fail-closed',()=>{
 assert.match(w,/verify-deployed-release\.mjs/);
 assert.match(shell,/connect-src 'none'/);
 assert.match(shell,/LIVE_PROVIDER_CONFIG=Object\.freeze\(/);
 assert.match(shell,/networkPolicy:'deny_until_auth_and_provider'/);
});
test('preview links stay within deployment sibling routes',()=>{
 assert.match(prep,/publicPreview/);
 assert.match(vp,/Money Lab/);
 assert.match(vp,/Account Center/);
 assert.match(vp,/Support Center/);
});
test('offline service worker stays scoped to preview shell',()=>{
 assert.match(sw,/CACHE_NAME=CACHE_PREFIX\+'v4'/);
 assert.match(sw,/async function validShell\(response,url\)/);
 assert.match(sw,/async function validAsset\(response,url\)/);
 assert.match(sw,/redirect:'error',cache:'no-store'/);
 assert.match(sw,/Unverified offline preview install asset/);
 assert.match(sw,/if\(createdCache\)/);
 assert.match(sw,/cacheAlreadyExisted/);
 assert.match(sw,/await caches.delete\(CACHE_NAME\)/);
 assert.match(sw,/const cache=await caches.open\(CACHE_NAME\)/);
 assert.match(sw,/if\(request\.method!=='GET'\)return/);
 assert.match(sw,/if\(url\.origin!==ROOT_URL\.origin\)return/);
 assert.match(sw,/if\(url\.pathname!==SHELL_PATH&&url\.pathname!==SHELL_PATH\+'index\.html'\)return/);
 assert.match(sw,/safeResponse\(response,url\)/);
 assert.match(sw,/event\.waitUntil\(saveToCache/);
});
test('integrated PWA regression suite contains current offline poison defenses',()=>{
 const source=read('public-preview-sw.test.mjs');
 for(const name of [
  'wrong-path cached 200 HTML',
  'cross-origin cached 200 HTML',
  'locally corrupted current-version shell',
  'invalid static asset cannot enter cache',
  'same-origin HTTP redirect cannot be accepted'
 ])assert.ok(source.includes(name),'missing test: '+name);
});
test('financial backup requires exact whitelist and no session restoration',()=>{
 assert.match(shell,/const RAW_BACKUP_EXPORT_KEYS=Object\.freeze/);
 assert.match(shell,/const RAW_RESTORE_KEYS=RAW_BACKUP_EXPORT_KEYS/);
 assert.match(shell,/function validatedRawLocalBackup/);
 assert.match(shell,/function restoreVerifiedRawLocalBackup/);
 assert.match(shell,/function isRawBackupSafeLocalKey/);
 assert.match(shell,/sessionStorage:\{\}/);
});
test('independent security checks are present and not being intentionally skipped',()=>{
 assert.doesNotMatch(w,/\bcontinue-on-error:\s*true/);
 // The bounded curl retry loop intentionally uses || true, then fails after all attempts.
 // Only permanent bypasses of validation are forbidden here.
 assert.match(w,/Run.*release smoke check|Production release smoke check/);
});
