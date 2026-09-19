import fs from 'node:fs';

const failures=[];
const requireFile=(path)=>{if(!fs.existsSync(path)){failures.push('missing file: '+path);return null;}return fs.readFileSync(path,'utf8');};
const requireText=(label,content,text)=>{if(!content?.includes(text))failures.push(label);};
const forbidText=(label,content,text)=>{if(content?.includes(text))failures.push(label);};

const html=requireFile('index.html');
const workflow=requireFile('.github/workflows/pages.yml');
const changelog=requireFile('CHANGELOG.md');
const configText=requireFile('release.config.json');
const phase0=requireFile('phase0-static-check.mjs');
const policy=requireFile('RELEASE_POLICY.md');
const checklist=requireFile('RELEASE_CHECKLIST.md');
const prep=requireFile('prepare-site.mjs');

let config=null;
if(configText){
  try{config=JSON.parse(configText);}catch(e){failures.push('release.config.json is invalid JSON: '+e.message);}
}

if(html){
  const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
  if(scripts.length<2)failures.push('expected at least two application script blocks');
  scripts.forEach((s,i)=>{try{new Function(s);}catch(e){failures.push('script '+i+' syntax: '+e.message);}});

  const critical=[
    ['Home route','async function renderHome'],
    ['Details route','function renderDetails'],
    ['Connected Data','renderConnections'],
    ['Privacy route','function renderPrivacy'],
    ['Device QA','function renderDeviceQA'],
    ['Performance route','function renderPerformance'],
    ['Data model route','function renderDataModel'],
    ['Phase 14 trust audit','runPhase14TrustAudit'],
    ['Core schema v3','CORE_SCHEMA_VERSION = 3'],
    ['Portable export','downloadPortableDataExport'],
    ['Import preview','buildConnectedImportPreview'],
    ['Local state key','thisweek.state.v2']
  ];
  for(const [label,text] of critical)requireText('missing '+label,html,text);

  forbidText('browser zoom must remain enabled',html,'maximum-scale=1');
  forbidText('no obvious eval usage',html,'eval(');
  if(/<script\s+src=/i.test(html))failures.push('external runtime script dependency detected');
  if(/<link[^>]+rel=["']stylesheet["'][^>]+href=/i.test(html))failures.push('external runtime stylesheet dependency detected');
}

if(workflow){
  requireText('Pages workflow must deploy only main',workflow,'branches: ["main"]');
  requireText('Pages workflow must run phase0 static check',workflow,'node phase0-static-check.mjs');
  requireText('Pages workflow must run release smoke check',workflow,'node release-smoke-check.mjs');
  requireText('Pages workflow must create release manifest',workflow,'release.json');
  requireText('Pages workflow must post-deploy verify',workflow,'Verify deployed release');
  requireText('Pages workflow must deploy _site artifact',workflow,'path: "_site"');
  requireText('Pages workflow must use deterministic production staging',workflow,'node prepare-site.mjs index.html _site/index.html');
  requireText('Pages workflow validation must stage production HTML first',workflow,'node prepare-site.mjs index.html index.production.html');
  requireText('Pages workflow must cancel stale in-progress production runs',workflow,'cancel-in-progress: true');
}

if(config){
  for(const k of ['release','channel','rollbackCommit','rollbackBranch','stableBranch','releaseRecord','stateSchema','portableSchema','migrationNotes']){
    if(config[k]===undefined||config[k]===null||config[k]==='')failures.push('release config missing '+k);
  }
  if(config.channel!=='production')failures.push('release channel must be production');
  if(!/^[0-9a-f]{40}$/.test(config.rollbackCommit||''))failures.push('rollbackCommit must be a full SHA');
}
if(changelog&&config)requireText('CHANGELOG missing current release entry',changelog,'## '+config.release);
if(policy)requireText('Release policy must identify main as production',policy,'main is production');
if(checklist)requireText('Release checklist must include rollback verification',checklist,'Rollback point');

if(!phase0)failures.push('phase0 checker unavailable');
if(prep){
  requireText('prepare-site script must refresh CSP hashes',prep,"createHash('sha256')");
  requireText('prepare-site script must reject unsafe-inline',prep,"unsafe-inline");
  requireText('prepare-site script must verify staged hashes',prep,'Staged CSP missing');
}

if(failures.length){
  console.error('Release smoke check FAILED');
  failures.forEach(x=>console.error('- '+x));
  process.exit(1);
}
console.log('Release smoke check passed');
console.log(JSON.stringify({
  release:config?.release,
  rollbackCommit:config?.rollbackCommit,
  scripts:[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].length,
  checkedAt:new Date().toISOString()
},null,2));
