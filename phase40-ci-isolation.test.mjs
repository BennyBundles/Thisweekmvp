import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync(new URL('./.github/workflows/pages.yml',import.meta.url),'utf8');
const smoke=readFileSync(new URL('./release-smoke-check.mjs',import.meta.url),'utf8');
const group=workflow.match(/^  group: (.+)$/m)?.[1]||'';
const cancel=workflow.match(/^  cancel-in-progress: (.+)$/m)?.[1]||'';
const deploy=workflow.match(/^  deploy:\n([\s\S]*?)\n    needs: validate/m)?.[1]||'';

test('PR runs use a unique concurrency group per PR number',()=>{
  assert.match(group,/github\.event_name == 'pull_request'/);
  assert.match(group,/format\('pages-pr-\{0\}', github\.event\.pull_request\.number\)/);
});
test('a manual non-main dispatch never enters production group',()=>{
  assert.match(group,/github\.ref != 'refs\/heads\/main'/);
  assert.match(group,/format\('pages-dispatch-\{0\}', github\.ref\)/);
});
test('only superseded PR jobs are cancelled, not active production publishing',()=>{
  assert.equal(cancel,"${{ github.event_name == 'pull_request' }}");
  assert.doesNotMatch(workflow,/cancel-in-progress: true/);
});
test('deploy job is main-only for push and dispatch and never runs for PR',()=>{
  assert.match(deploy,/if: github\.ref == 'refs\/heads\/main' && \(github\.event_name == 'push' \|\| github\.event_name == 'workflow_dispatch'\)/);
});
test('least privilege limits Pages writing to deploy job',()=>{
  assert.match(workflow,/^permissions:\n  contents: read\n/m);
  assert.match(workflow,/^  deploy:[\s\S]*?    permissions:\n      contents: read\n      pages: write\n      id-token: write\n/m);
  assert.doesNotMatch(workflow,/^permissions:\n  contents: read\n  pages: write/m);
});
test('smoke check rejects a future regression to unconditional cancellation',()=>{
  assert.match(smoke,/forbidText\('Pages workflow must not unconditionally cancel production deployment'/);
  assert.match(smoke,/Pages workflow must restrict publish to main branch/);
});
test('exact release verification remains required after production deploy',()=>{
  assert.match(workflow,/name: Fail-closed deployed release and route integrity audit/);
  assert.match(workflow,/run: node verify-deployed-release\.mjs/);
});
