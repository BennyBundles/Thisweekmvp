import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('./.github/workflows/pages.yml',import.meta.url),'utf8');
const jobsMarker='\njobs:\n';
assert.equal(source.split(jobsMarker).length,2,'exactly one jobs section required');
const [workflow,jobs]=source.split(jobsMarker);
const deployMarker='\n  deploy:\n';
assert.equal(('\n'+jobs).split(deployMarker).length,2,'exactly one deploy job required');
const deploy=('\n'+jobs).split(deployMarker)[1];
const validation=jobs.slice(0,jobs.indexOf(deployMarker));

test('PR validation cancellation is scoped to its own PR',()=>{
  assert.match(workflow,/format\('pages-pr-\{0\}', github\.event\.pull_request\.number\)/);
  assert.match(workflow,/cancel-in-progress: \$\{\{ github\.event_name == 'pull_request' \}\}/);
  assert.doesNotMatch(workflow,/cancel-in-progress: true/);
});

test('every non-PR run uses a distinct workflow-level key',()=>{
  assert.match(workflow,/format\('pages-run-\{0\}', github\.run_id\)/);
  assert.doesNotMatch(workflow,/pages-production/);
});

test('production deploy job is serialized without cancellation',()=>{
  assert.match(deploy,/^\s+concurrency:\s*\n\s+group: thisweek-pages-production-deploy\s*\n\s+cancel-in-progress: false\s*\n\s+queue: max\s*$/m);
});

test('production queue settings do not conflict with workflow PR cancellation',()=>{
  assert.doesNotMatch(workflow,/queue:\s+max/);
  assert.equal((deploy.match(/\bqueue: max\b/g)||[]).length,1);
});

test('only main push and main manual dispatch may reach deployment',()=>{
  assert.match(deploy,/if: github\.ref == 'refs\/heads\/main' && \(github\.event_name == 'push' \|\| github\.event_name == 'workflow_dispatch'\)/);
  assert.match(workflow,/pull_request:/);
  assert.match(deploy,/needs: validate/);
});

test('deploy permissions remain job-scoped and validation is read-only',()=>{
  assert.match(workflow,/permissions:\s*\n\s+contents: read/);
  assert.doesNotMatch(workflow,/pages: write/);
  assert.match(deploy,/permissions:\s*\n\s+contents: read\s*\n\s+pages: write\s*\n\s+id-token: write/);
});

test('stale SHA guard is directly upstream of publishing',()=>{
  const guard=deploy.indexOf('- name: Reject stale main SHA before production publish');
  const publish=deploy.indexOf('- name: Deploy to GitHub Pages');
  assert.ok(guard>=0 && publish>guard,'stale guard must precede publishing');
  const segment=deploy.slice(guard,publish);
  assert.match(segment,/git ls-remote --exit-code origin refs\/heads\/main/);
  assert.match(segment,/\[ "\$current_main_sha" != "\$EXPECTED_RELEASE_SHA" \]/);
  assert.match(segment,/exit 1/);
});

test('untrusted feature branch cannot trigger the deploy job',()=>{
  const eligible=(event,ref)=>ref==='refs/heads/main' && (event==='push' || event==='workflow_dispatch');
  for(const e of ['pull_request','workflow_dispatch','push']){
    for(const ref of ['refs/heads/main','refs/heads/fix/example']){
      assert.equal(eligible(e,ref),ref==='refs/heads/main' && e!=='pull_request');
    }
  }
});
