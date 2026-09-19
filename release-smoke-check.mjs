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
const phase23Doc=requireFile('PHASE_23_IMPLEMENTATION.md');
const phase23Schema=requireFile('supabase/phase23/account_security.sql');
const accountGateway=requireFile('supabase/functions/thisweek-account-gateway/index.ts');
const accountHtml=requireFile('account/index.html');
const accountJs=requireFile('account/app.js');
const accountReleaseConfig=requireFile('account/release-config.js');
const accountCheck=requireFile('account-check.mjs');
const phase24Doc=requireFile('PHASE_24_IMPLEMENTATION.md');
const authProductionSetup=requireFile('AUTH_PRODUCTION_SETUP.md');
const phase26Doc=requireFile('PHASE_26_IMPLEMENTATION.md');
const phase26Schema=requireFile('supabase/phase26/returns_disputes.sql');
const phase27Doc=requireFile('PHASE_27_IMPLEMENTATION.md');
const phase27Schema=requireFile('supabase/phase27/staff_ops.sql');
const opsGateway=requireFile('supabase/functions/thisweek-ops-gateway/index.ts');
const opsHtml=requireFile('ops/index.html');
const opsJs=requireFile('ops/app.js');
const opsCheck=requireFile('ops-check.mjs');
const opsAccessSetup=requireFile('OPS_ACCESS_SETUP.md');
const phase28Doc=requireFile('PHASE_28_IMPLEMENTATION.md');
const phase28Schema=requireFile('supabase/phase28/support_incident_ops.sql');
const supportGateway=requireFile('supabase/functions/thisweek-support-gateway/index.ts');
const supportHtml=requireFile('support/index.html');
const supportJs=requireFile('support/app.js');
const supportCheck=requireFile('support-check.mjs');


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
    ['Phase 22 credential-gated chain',"sandboxChainMode:'deployed_credentials_required'"],
    ['Phase 23 Account Center link',"externalTool('./account/'"],
    ['Phase 28 Support Center link',"externalTool('./support/'"],
    ['Phase 26 operations readiness',"operationsMode:'returns_disputes_negative_balance_deployed'"]
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
  requireText('Phase 24 card auth calls risk-aware reserve RPC',phase21CardAuth,'tw_money_risk_reserve_card_authorization');
  requireText('Phase 24 card auth risk declines fail closed',phase21CardAuth,'reason.startsWith("risk_")');
}
if(phase21Doc)requireText('Phase 21 doc production boundary',phase21Doc,'no live money movement');
if(moneyLabHtml)requireText('Money Lab exact Supabase origin',moneyLabHtml,'connect-src https://xjtvawmppzwzrooairyx.supabase.co');
if(moneyLabJs){
  requireText('Money Lab provider preflight',moneyLabJs,"gateway('provider_preflight')");
  requireText('Money Lab provider readiness renderer',moneyLabJs,'renderProviderChecks');
  requireText('Money Lab provider control gating',moneyLabJs,'applyProviderControlState');
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
  requireText('Phase 22 gateway provider preflight',phase20Gateway,'provider_preflight');
  requireText('Phase 22 gateway preflight Sandbox lock',phase20Gateway,'if (MONEY_EXECUTION_MODE !== "sandbox") return result');
}
if(phase19Gateway)requireText('Phase 22 provider gateway must request Plaid Auth',phase19Gateway,'products: ["auth", "transactions"]');

if(phase23Schema){
  requireText('Phase 23 session RPC',phase23Schema,'tw_auth_session_active');
  requireText('Phase 23 closure table',phase23Schema,'tw_account_closure_requests');
  requireText('Phase 23 browser roles revoked',phase23Schema,'from public, anon, authenticated');
}
if(accountGateway){
  requireText('Phase 23 Account Gateway validates active session',accountGateway,'tw_auth_session_active');
  requireText('Phase 23 Account Gateway hard delete',accountGateway,'auth.admin.deleteUser');
  requireText('Phase 23 Account Gateway retention review',accountGateway,'retention_review_required');
}
if(accountHtml)requireText('Account Center exact Supabase origin',accountHtml,'connect-src https://xjtvawmppzwzrooairyx.supabase.co');
if(accountJs){
  requireText('Account Center password recovery',accountJs,'/auth/v1/recover');
  requireText('Account Center MFA',accountJs,'/auth/v1/factors');
  requireText('Account Center global signout',accountJs,'/auth/v1/logout?scope=global');
  requireText('Account Center account gateway',accountJs,'/functions/v1/thisweek-account-gateway');
  if(/service_role|sb_secret_/i.test(accountJs))failures.push('Account Center contains server-secret pattern');
}
if(!accountCheck)failures.push('Account Center checker unavailable');
if(accountReleaseConfig){
  requireText('Phase 24 Auth config canonical URL',accountReleaseConfig,'https://bennybundles.github.io/Thisweekmvp/account/');
  requireText('Phase 24 Auth config public readiness',accountReleaseConfig,'publicAuthReady:');
  requireText('Phase 24 Auth config Turnstile provider',accountReleaseConfig,"provider:'turnstile'");
  if(/service_role|sb_secret_/i.test(accountReleaseConfig))failures.push('Auth release config contains server-secret pattern');
}
if(accountHtml){
  requireText('Phase 24 Account Center release gate UI',accountHtml,'authReleaseGates');
  requireText('Phase 24 Account Center Turnstile CSP',accountHtml,'https://challenges.cloudflare.com');
}
if(accountJs){
  requireText('Phase 24 Account Center CAPTCHA metadata',accountJs,'gotrue_meta_security');
  requireText('Phase 24 Account Center canonical confirmation redirect',accountJs,'CONFIRM_REDIRECT');
  requireText('Phase 24 Account Center canonical recovery redirect',accountJs,'RECOVERY_REDIRECT');
  requireText('Phase 24 Account Center signup cooldown',accountJs,"assertCooldown('signup',60000");
  requireText('Phase 24 Account Center recovery cooldown',accountJs,"assertCooldown('recover',60000");
}
if(phase24Doc)requireText('Phase 24 doc hosted gates remain explicit',phase24Doc,'hosted Supabase');
if(authProductionSetup)requireText('Auth production setup exact recovery redirect',authProductionSetup,'https://bennybundles.github.io/Thisweekmvp/account/?mode=recovery');

if(phase26Schema){
  requireText('Phase 26 schema ops cases',phase26Schema,'tw_ops_cases');
  requireText('Phase 26 schema append-only ops events',phase26Schema,'tw_ops_case_events');
  requireText('Phase 26 schema ACH return RPC',phase26Schema,'tw_money_apply_unit_ach_return');
  requireText('Phase 26 schema card credit RPC',phase26Schema,'tw_money_apply_unit_card_credit');
  requireText('Phase 26 schema dispute RPC',phase26Schema,'tw_ops_record_unit_dispute');
}
if(phase21Webhook){
  requireText('Phase 26 webhook ACH return handling',phase21Webhook,'tw_money_apply_unit_ach_return');
  requireText('Phase 26 webhook dispute handling',phase21Webhook,'tw_ops_record_unit_dispute');
  requireText('Phase 26 webhook negative balance restriction',phase21Webhook,'negative_provider_balance');
}
if(phase20Gateway){
  requireText('Phase 26 gateway ops status',phase20Gateway,'ops_status');
  requireText('Phase 26 gateway Sandbox dispute creation',phase20Gateway,'unit_sandbox_create_dispute');
  requireText('Phase 26 gateway Sandbox dispute action',phase20Gateway,'unit_sandbox_dispute_action');
}
if(phase26Doc)requireText('Phase 26 doc preserves append-only doctrine',phase26Doc,'append-only');

if(phase27Schema){
  requireText('Phase 27 staff audit table',phase27Schema,'tw_ops_staff_actions');
  requireText('Phase 27 alerts table',phase27Schema,'tw_ops_alerts');
}
if(opsGateway){
  requireText('Phase 27 server role source',opsGateway,'app_metadata');
  requireText('Phase 27 AAL2',opsGateway,'mfa_aal2_required');
  requireText('Phase 28 support staff action',opsGateway,'support_reply');
  requireText('Phase 28 incident action',opsGateway,'open_incident');
  requireText('Phase 28 health monitor',opsGateway,'buildHealth');
}
if(opsHtml)requireText('Phase 28 Ops support queue',opsHtml,'id="support"');
if(opsJs)requireText('Phase 28 Ops health renderer',opsJs,'renderHealth');
if(!opsCheck)failures.push('Ops Console checker unavailable');
if(!opsAccessSetup)failures.push('Ops access setup guide unavailable');

if(phase28Schema){
  requireText('Phase 28 support request table',phase28Schema,'tw_support_requests');
  requireText('Phase 28 support message table',phase28Schema,'tw_support_messages');
  requireText('Phase 28 incident table',phase28Schema,'tw_ops_incidents');
  requireText('Phase 28 internal SLA policy',phase28Schema,'public_commitment');
  requireText('Phase 28 browser grants revoked',phase28Schema,'from public,anon,authenticated');
}
if(supportGateway){
  requireText('Phase 28 support gateway auth',supportGateway,'auth.getUser(token)');
  requireText('Phase 28 support session revocation check',supportGateway,'tw_auth_session_active');
  requireText('Phase 28 support secret guard',supportGateway,'sensitive_secret_pattern_rejected');
}
if(supportHtml)requireText('Phase 28 support no-direct-money copy',supportHtml,'never directly changes or refunds money');
if(supportJs){
  requireText('Phase 28 support gateway client',supportJs,'/functions/v1/thisweek-support-gateway');
  if(/service_role|sb_secret_/i.test(supportJs))failures.push('Support Center contains server-secret pattern');
}
if(!supportCheck)failures.push('Support Center checker unavailable');
if(phase28Doc)requireText('Phase 28 internal SLA disclosure',phase28Doc,'not customer-facing service guarantees');
if(phase20Gateway)requireText('Money gateway rejects revoked session',phase20Gateway,'tw_auth_session_active');
if(phase19Gateway)requireText('Provider gateway rejects revoked session',phase19Gateway,'tw_auth_session_active');


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
