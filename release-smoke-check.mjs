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
const phase19Doc=requireFile('PHASE_19_IMPLEMENTATION.md');
const phase19Schema=requireFile('supabase/phase19/provider_schema.sql');
const phase19Gateway=requireFile('supabase/functions/thisweek-provider-gateway/index.ts');
const phase19Runtime=requireFile('supabase/functions/thisweek-provider-gateway/deno.json');
const phase19Readme=requireFile('supabase/phase19/README.md');
const phase20Doc=requireFile('PHASE_20_IMPLEMENTATION.md');
const phase20Schema=requireFile('supabase/phase20/money_layer_schema.sql');
const phase20Gateway=requireFile('supabase/functions/thisweek-money-gateway/index.ts');
const phase20Runtime=requireFile('supabase/functions/thisweek-money-gateway/deno.json');
const phase20Readme=requireFile('supabase/phase20/README.md');
const phase21Doc=requireFile('PHASE_21_IMPLEMENTATION.md');
const phase21Schema=requireFile('supabase/phase21/card_event_schema.sql');
const phase21Webhook=requireFile('supabase/functions/thisweek-money-webhook/index.ts');
const phase21CardAuth=requireFile('supabase/functions/thisweek-unit-card-authorization/index.ts');
const moneyLabHtml=requireFile('money-lab/index.html');
const moneyLabJs=requireFile('money-lab/app.js');
const moneyLabCheck=requireFile('money-lab-check.mjs');
const phase22Doc=requireFile('PHASE_22_IMPLEMENTATION.md');
const phase22Schema=requireFile('supabase/phase22/provider_sandbox_chain.sql');


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
    ['Local state key','thisweek.state.v2'],
    ['Phase 19 secure provider staging','PHASE 19 — SECURE PROVIDER GATEWAY v31'],
    ['Phase 19 disabled client provider','enabled:false'],
    ['Phase 19 deny-until-auth-provider',"networkPolicy:'deny_until_auth_and_provider'"],
    ['Phase 19 disabled connect control','id="connectFinancialProvider"'],
    ['Phase 20 money config','const LIVE_MONEY_CONFIG=Object.freeze({'],
    ['Phase 20 money execution disabled',"executionMode:'disabled'"],
    ['Phase 20 network locked',"networkPolicy:'deny_until_sandbox_auth_and_credentials'"],
    ['Phase 20 money route','async function renderMoneyCenter()'],
    ['Phase 20 direct deposit route','async function renderDirectDeposit()'],
    ['Phase 20 bill pay route','async function renderBillPay()'],
    ['Phase 20 cards route','async function renderCategoryCards()'],
    ['Phase 21 signed webhooks',"webhookMode:'signed_receivers_deployed'"],
    ['Phase 21 card authorization controller',"cardAuthorizationMode:'controller_deployed_execution_locked'"],
    ['Phase 21 Money Lab link','href="./money-lab/"'],
    ['Phase 22 Sandbox chain',"sandboxChain:'plaid_unit_pinwheel_method'"],
    ['Phase 22 credential-gated chain',"sandboxChainMode:'deployed_credentials_required'"]
  ];
  for(const [label,text] of critical)requireText('missing '+label,html,text);

  forbidText('browser zoom must remain enabled',html,'maximum-scale=1');
  forbidText('no obvious eval usage',html,'eval(');
  if(/<script\s+src=/i.test(html))failures.push('external runtime script dependency detected');
  if(/<link[^>]+rel=["']stylesheet["'][^>]+href=/i.test(html))failures.push('external runtime stylesheet dependency detected');
}

if(phase19Schema){
  requireText('Phase 19 schema missing provider connections',phase19Schema,'tw_provider_connections');
  requireText('Phase 19 schema missing provider transactions',phase19Schema,'tw_provider_transactions');
  requireText('Phase 19 schema must enable RLS',phase19Schema,'enable row level security');
}
if(phase19Gateway){
  requireText('Phase 19 gateway must validate authenticated user',phase19Gateway,'auth.getUser(token)');
  requireText('Phase 19 gateway must use Vault bridge',phase19Gateway,'tw_vault_create');
  requireText('Phase 19 gateway must support transaction sync',phase19Gateway,'/transactions/sync');
  requireText('Phase 19 gateway must support disconnect',phase19Gateway,'/item/remove');
  requireText('Phase 19 gateway must parse current Hosted Link results',phase19Gateway,'item_add_results');
}
if(phase19Runtime)requireText('Phase 19 runtime should be strict',phase19Runtime,'"strict": true');
if(phase19Readme)requireText('Phase 19 README must record shared project isolation',phase19Readme,'BennyBundles’s Project');
if(phase19Doc)requireText('Phase 19 doc must state live provider is not active',phase19Doc,'No live financial institution is connected.');

if(phase20Schema){
  requireText('Phase 20 schema missing double-entry journal',phase20Schema,'tw_money_journals');
  requireText('Phase 20 schema missing ledger entries',phase20Schema,'tw_money_ledger_entries');
  requireText('Phase 20 schema missing bill payments',phase20Schema,'tw_money_bill_payments');
  requireText('Phase 20 schema missing cards',phase20Schema,'tw_money_virtual_cards');
  requireText('Phase 20 schema must revoke browser roles',phase20Schema,'from public, anon, authenticated');
  requireText('Phase 20 schema must be append-only',phase20Schema,'reject_money_history_mutation');
  requireText('Phase 20 reward template must be inactive',phase20Schema,'active=false');
}
if(phase20Gateway){
  requireText('Phase 20 gateway must validate authenticated user',phase20Gateway,'auth.getUser(token)');
  requireText('Phase 20 gateway must reject anonymous users',phase20Gateway,'recoverable_auth_required');
  requireText('Phase 20 gateway must lock provider execution',phase20Gateway,'THISWEEK_MONEY_EXECUTION_MODE');
  requireText('Phase 20 gateway must lock production money',phase20Gateway,'THISWEEK_LIVE_MONEY_ENABLED');
  requireText('Phase 20 gateway must use ledger move RPC',phase20Gateway,'tw_money_move_balance');
  requireText('Phase 20 gateway must expose Unit sandbox adapter',phase20Gateway,'api.s.unit.sh');
  requireText('Phase 20 gateway must pin Pinwheel version',phase20Gateway,'2025-07-08');
  requireText('Phase 20 gateway must support Method payments',phase20Gateway,'/payments');
}
if(phase20Runtime)requireText('Phase 20 runtime should be strict',phase20Runtime,'"strict": true');
if(phase20Readme)requireText('Phase 20 README must say execution is disabled',phase20Readme,'Money execution: disabled.');
if(phase20Doc)requireText('Phase 20 doc must preserve Plan authority',phase20Doc,'Available Now` remains plan-derived.');

if(phase21Schema){
  requireText('Phase 21 schema reserve controller',phase21Schema,'tw_money_reserve_card_authorization');
  requireText('Phase 21 schema release controller',phase21Schema,'tw_money_release_card_authorization');
  requireText('Phase 21 schema settlement controller',phase21Schema,'tw_money_settle_card_authorization');
  requireText('Phase 21 schema service-only controllers',phase21Schema,'from public,anon,authenticated');
}
if(phase21Webhook){
  requireText('Phase 21 webhook verifies Unit signature',phase21Webhook,'x-unit-signature');
  requireText('Phase 21 webhook verifies Pinwheel signature',phase21Webhook,'x-pinwheel-signature');
  requireText('Phase 21 webhook verifies Method signature',phase21Webhook,'method-webhook-signature');
  requireText('Phase 21 webhook stores only safe event summary',phase21Webhook,'safe_summary');
}
if(phase21CardAuth){
  requireText('Phase 21 card auth has execution lock',phase21CardAuth,'THISWEEK_MONEY_EXECUTION_MODE');
  requireText('Phase 21 card auth fail closed',phase21CardAuth,'RestrictedCard');
  requireText('Phase 21 card auth calls reserve RPC',phase21CardAuth,'tw_money_reserve_card_authorization');
}
if(phase21Doc)requireText('Phase 21 doc production boundary',phase21Doc,'no live money movement');
if(moneyLabHtml)requireText('Money Lab exact Supabase origin',moneyLabHtml,'connect-src https://xjtvawmppzwzrooairyx.supabase.co');
if(moneyLabJs){
  requireText('Money Lab uses publishable key',moneyLabJs,'sb_publishable_');
  requireText('Money Lab supports TOTP',moneyLabJs,'/challenge');
  requireText('Money Lab invokes authenticated gateway',moneyLabJs,'/functions/v1/thisweek-money-gateway');
  if(/service_role|sb_secret_/i.test(moneyLabJs))failures.push('Money Lab contains server-secret pattern');
}
if(!moneyLabCheck)failures.push('Money Lab checker unavailable');

if(phase22Schema){
  requireText('Phase 22 schema Unit application ref',phase22Schema,'provider_application_id');
  requireText('Phase 22 schema Method entity ref',phase22Schema,'method_entity_id');
  requireText('Phase 22 schema funding processor link',phase22Schema,'unit_counterparty');
}
if(phase22Doc){
  requireText('Phase 22 doc must keep execution gated',phase22Doc,'provider execution remains credential-gated');
  requireText('Phase 22 doc must preserve production CSP',phase22Doc,"connect-src 'none'");
}
if(phase20Gateway){
  requireText('Phase 22 gateway processor token',phase20Gateway,'/processor/token/create');
  requireText('Phase 22 gateway Unit app',phase20Gateway,'unit_sandbox_application');
  requireText('Phase 22 gateway Unit account',phase20Gateway,'unit_create_deposit_account');
  requireText('Phase 22 gateway ACH pull',phase20Gateway,'unit_fund_from_external');
  requireText('Phase 22 gateway Method setup',phase20Gateway,'method_sandbox_setup');
  requireText('Phase 22 gateway Method pay',phase20Gateway,'method_sandbox_payment');
  requireText('Phase 22 gateway Unit auth webhook',phase20Gateway,'OnlyAuthorizationRequest');
  requireText('Phase 22 gateway Unit event webhook',phase20Gateway,'NotAuthorizationRequest');
  requireText('Phase 22 gateway Pinwheel DD webhook',phase20Gateway,'direct_deposit_switch.added');
  requireText('Phase 22 gateway Method signed webhook setup',phase20Gateway,'METHOD_WEBHOOK_HMAC_SECRET');
  requireText('Phase 22 gateway webhook registration action',phase20Gateway,'register_sandbox_webhooks');
}
if(phase19Gateway)requireText('Phase 22 provider gateway must request Plaid Auth',phase19Gateway,'products: ["auth", "transactions"]');


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
  if(config.releaseRecord&&!fs.existsSync(config.releaseRecord))failures.push('release record file does not exist: '+config.releaseRecord);
  if(config.stableBranch&&!/^stable\//.test(config.stableBranch))failures.push('stableBranch must use stable/ prefix');
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
