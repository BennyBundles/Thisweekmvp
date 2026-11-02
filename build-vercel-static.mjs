// Build the Vercel preview from the same explicitly approved static routes as GitHub Pages.
// Never serve the repository root: it also contains backend schemas, tests and release records.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const output = '_site';
const root = process.cwd();
const outputRoot = path.resolve(root, output);

function assert(ok, message) {
  if (!ok) throw new Error('Static preview rejected: ' + message);
}

function run(script, ...args) {
  execFileSync(process.execPath, [script, ...args], { stdio: 'inherit' });
}

function copy(source, destination) {
  assert(!source.startsWith('/') && !destination.startsWith('/'), 'absolute copy path');
  assert(!source.includes('..') && !destination.includes('..'), 'path traversal');
  const from = path.resolve(root, source);
  const to = path.resolve(outputRoot, destination);
  assert(to.startsWith(outputRoot + path.sep), 'copy escapes output');
  assert(fs.existsSync(from) && fs.statSync(from).isFile(), 'missing source file ' + source);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function verifyInlineCsp(file) {
  const html = fs.readFileSync(path.join(outputRoot, file), 'utf8');
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1]);
  assert(scripts.length === 2, file + ': must have exactly two inline scripts');
  const meta = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);
  assert(meta, file + ': missing CSP meta tag');
  const directives = meta[1].split(';').map(s => s.trim()).filter(Boolean);
  const policy = directives.find(s => s.startsWith('script-src '));
  assert(policy, file + ': missing script-src');
  assert(!policy.includes("'unsafe-inline'"), file + ': unsafe-inline scripts allowed');
  const actual = [...policy.matchAll(/'sha256-([^']+)'/g)].map(m => m[1]);
  const expected = scripts.map(s => createHash('sha256').update(s, 'utf8').digest('base64'));
  assert(actual.length === 2 && actual.every((hash, i) => hash === expected[i]), file + ': inline script CSP hash mismatch');
  return { file, inlineScripts: scripts.length, cspHashesValid: true };
}

function listFiles(directory, prefix = '') {
  const result = [];
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    const relative = prefix ? prefix + '/' + item.name : item.name;
    if (item.isDirectory()) result.push(...listFiles(path.join(directory, item.name), relative));
    else {
      assert(item.isFile(), 'unexpected non-file artifact ' + relative);
      result.push(relative);
    }
  }
  return result;
}

const copied = [
  ['.nojekyll', '.nojekyll'],
  ['preview.html', 'preview.html'],
  ['public-preview-manifest.webmanifest', 'public-preview/manifest.webmanifest'],
  ['public-preview-sw.js', 'public-preview/sw.js'],
  ['public-preview-icon.svg', 'public-preview/icon.svg'],
  ['money-lab/index.html', 'money-lab/index.html'],
  ['money-lab/app.js', 'money-lab/app.js'],
  ['account/index.html', 'account/index.html'],
  ['account/app.js', 'account/app.js'],
  ['account/release-config.js', 'account/release-config.js'],
  ['ops/index.html', 'ops/index.html'],
  ['ops/app.js', 'ops/app.js'],
  ['ops/release/index.html', 'ops/release/index.html'],
  ['ops/release/app.js', 'ops/release/app.js'],
  ['ops/bootstrap/index.html', 'ops/bootstrap/index.html'],
  ['ops/bootstrap/app.js', 'ops/bootstrap/app.js'],
  ['support/index.html', 'support/index.html'],
  ['support/app.js', 'support/app.js'],
  ['legal/sandbox/index.html', 'legal/sandbox/index.html']
];

fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(outputRoot, { recursive: true });

// Recompute CSP hashes for the exact HTML bytes Vercel serves.
run('prepare-site.mjs', 'index.html', '_site/index.html');
run('prepare-public-preview.mjs', 'index.html', '_site/public-preview.source.html');
run('prepare-site.mjs', '_site/public-preview.source.html', '_site/public-preview/index.html');
fs.rmSync(path.join(outputRoot, 'public-preview.source.html'));

for (const [source, destination] of copied) copy(source, destination);

// Execute static route validators against the actual staged files.
run('public-preview-check.mjs', '_site/public-preview/index.html');
run('money-lab-check.mjs', '_site/money-lab/index.html', '_site/money-lab/app.js');
run('account-check.mjs', '_site/account/index.html', '_site/account/app.js', '_site/account/release-config.js');
run('ops-check.mjs', '_site/ops/index.html', '_site/ops/app.js');
run('phase34-check.mjs');
run('phase34c-check.mjs');
run('support-check.mjs', '_site/support/index.html', '_site/support/app.js');
run('legal-check.mjs', '_site/legal/sandbox/index.html');

const hashes = [
  verifyInlineCsp('index.html'),
  verifyInlineCsp('public-preview/index.html')
];

// Preview evidence is not a claim of a GitHub Pages production release.
const previewManifest = {
  application: 'This Week',
  channel: 'vercel-preview-static-allowlist',
  sourceCommit: process.env.VERCEL_GIT_COMMIT_SHA || null,
  sourceRef: process.env.VERCEL_GIT_COMMIT_REF || null,
  productionReleaseAttested: false,
  generatedAt: new Date().toISOString(),
  verifiedInlineCsp: true
};
fs.writeFileSync(path.join(outputRoot, 'preview-build.json'), JSON.stringify(previewManifest, null, 2) + '\n');

// Fail closed if a future edit copies source code, database definitions, credentials,
// GitHub workflow files or any other unapproved artifact into the public deployment.
const approved = new Set(['index.html', 'public-preview/index.html', 'preview-build.json', ...copied.map(([, dst]) => dst)]);
const actualFiles = listFiles(outputRoot);
const unexpected = actualFiles.filter(file => !approved.has(file));
const missing = [...approved].filter(file => !actualFiles.includes(file));
assert(unexpected.length === 0, 'unexpected public files: ' + unexpected.join(', '));
assert(missing.length === 0, 'missing public files: ' + missing.join(', '));
assert(!actualFiles.some(file => /(^|\/)(supabase|\.github)(\/|$)|\.sql$|\.env|\.mjs$|\.md$/i.test(file)), 'private source in public output');

console.log(JSON.stringify({
  result: 'VERCEL_STATIC_ARTIFACT_PASS',
  fileCount: actualFiles.length,
  outputDirectory: output,
  csp: hashes,
  approvedOnly: true,
  sourceCommit: previewManifest.sourceCommit
}, null, 2));