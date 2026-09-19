#!/usr/bin/env node
/**
 * Phase 0 static regression check for This Week.
 * Usage: node phase0-static-check.mjs
 */
import fs from 'node:fs';
import {createHash} from 'node:crypto';

const html=fs.readFileSync(new URL('./index.html', import.meta.url),'utf8');
const failures=[];
const cspUpdaterUrl=new URL('./update-csp-hashes.mjs', import.meta.url);
const securityPrivacyUrl=new URL('./SECURITY_PRIVACY.md', import.meta.url);
const phase19SchemaUrl=new URL('./supabase/phase19/provider_schema.sql', import.meta.url);
const phase19GatewayUrl=new URL('./supabase/functions/thisweek-provider-gateway/index.ts', import.meta.url);
const phase19RuntimeUrl=new URL('./supabase/functions/thisweek-provider-gateway/deno.json', import.meta.url);
const phase19ReadmeUrl=new URL('./supabase/phase19/README.md', import.meta.url);
const phase19DocUrl=new URL('./PHASE_19_IMPLEMENTATION.md', import.meta.url);
const phase20SchemaUrl=new URL('./supabase/phase20/money_layer_schema.sql', import.meta.url);
const phase20GatewayUrl=new URL('./supabase/functions/thisweek-money-gateway/index.ts', import.meta.url);
const phase20RuntimeUrl=new URL('./supabase/functions/thisweek-money-gateway/deno.json', import.meta.url);
const phase20ReadmeUrl=new URL('./supabase/phase20/README.md', import.meta.url);
const phase20DocUrl=new URL('./PHASE_20_IMPLEMENTATION.md', import.meta.url);
const phase21SchemaUrl=new URL('./supabase/phase21/card_event_schema.sql', import.meta.url);
const phase21DocUrl=new URL('./PHASE_21_IMPLEMENTATION.md', import.meta.url);
const phase21WebhookUrl=new URL('./supabase/functions/thisweek-money-webhook/index.ts', import.meta.url);
const phase21CardAuthUrl=new URL('./supabase/functions/thisweek-unit-card-authorization/index.ts', import.meta.url);
const moneyLabHtmlUrl=new URL('./money-lab/index.html', import.meta.url);
const moneyLabJsUrl=new URL('./money-lab/app.js', import.meta.url);
const moneyLabCheckUrl=new URL('./money-lab-check.mjs', import.meta.url);
const phase22SchemaUrl=new URL('./supabase/phase22/provider_sandbox_chain.sql', import.meta.url);
const phase22DocUrl=new URL('./PHASE_22_IMPLEMENTATION.md', import.meta.url);
const phase23SchemaUrl=new URL('./supabase/phase23/account_security.sql', import.meta.url);
const phase23DocUrl=new URL('./PHASE_23_IMPLEMENTATION.md', import.meta.url);
const accountGatewayUrl=new URL('./supabase/functions/thisweek-account-gateway/index.ts', import.meta.url);
const accountHtmlUrl=new URL('./account/index.html', import.meta.url);
const accountJsUrl=new URL('./account/app.js', import.meta.url);
const accountReleaseConfigUrl=new URL('./account/release-config.js', import.meta.url);
const accountCheckUrl=new URL('./account-check.mjs', import.meta.url);
const phase24DocUrl=new URL('./PHASE_24_IMPLEMENTATION.md', import.meta.url);
const authProductionSetupUrl=new URL('./AUTH_PRODUCTION_SETUP.md', import.meta.url);
const phase26SchemaUrl=new URL('./supabase/phase26/returns_disputes.sql', import.meta.url);
const phase26DocUrl=new URL('./PHASE_26_IMPLEMENTATION.md', import.meta.url);
const phase27SchemaUrl=new URL('./supabase/phase27/staff_ops.sql', import.meta.url);
const phase27DocUrl=new URL('./PHASE_27_IMPLEMENTATION.md', import.meta.url);
const opsGatewayUrl=new URL('./supabase/functions/thisweek-ops-gateway/index.ts', import.meta.url);
const opsHtmlUrl=new URL('./ops/index.html', import.meta.url);
const opsJsUrl=new URL('./ops/app.js', import.meta.url);
const opsCheckUrl=new URL('./ops-check.mjs', import.meta.url);
const opsAccessSetupUrl=new URL('./OPS_ACCESS_SETUP.md', import.meta.url);
const phase28SchemaUrl=new URL('./supabase/phase28/support_incident_ops.sql', import.meta.url);
const phase28DocUrl=new URL('./PHASE_28_IMPLEMENTATION.md', import.meta.url);
const phase29SchemaUrl=new URL('./supabase/phase29/automated_monitoring.sql', import.meta.url);
const phase29DocUrl=new URL('./PHASE_29_IMPLEMENTATION.md', import.meta.url);
const phase30SchemaUrl=new URL('./supabase/phase30/notification_dispatcher.sql', import.meta.url);
const phase30DocUrl=new URL('./PHASE_30_IMPLEMENTATION.md', import.meta.url);
const opsNotifierUrl=new URL('./supabase/functions/thisweek-ops-notifier/index.ts', import.meta.url);
const opsNotifierRuntimeUrl=new URL('./supabase/functions/thisweek-ops-notifier/deno.json', import.meta.url);
const phase31SchemaUrl=new URL('./supabase/phase31/production_activation_interlock.sql', import.meta.url);
const phase31DocUrl=new URL('./PHASE_31_IMPLEMENTATION.md', import.meta.url);
const phase32SchemaUrl=new URL('./supabase/phase32/legal_retention.sql', import.meta.url);
const phase32DocUrl=new URL('./PHASE_32_IMPLEMENTATION.md', import.meta.url);
const phase33SchemaUrl=new URL('./supabase/phase33/privacy_export.sql', import.meta.url);
const phase33DocUrl=new URL('./PHASE_33_IMPLEMENTATION.md', import.meta.url);
const legalSandboxUrl=new URL('./legal/sandbox/index.html', import.meta.url);
const legalCheckUrl=new URL('./legal-check.mjs', import.meta.url);
const supportGatewayUrl=new URL('./supabase/functions/thisweek-support-gateway/index.ts', import.meta.url);
const supportHtmlUrl=new URL('./support/index.html', import.meta.url);
const supportJsUrl=new URL('./support/app.js', import.meta.url);
const supportCheckUrl=new URL('./support-check.mjs', import.meta.url);

const releaseFiles=['prepare-site.mjs','release-smoke-check.mjs','RELEASE_CHECKLIST.md','RELEASE_POLICY.md','release.config.json','CHANGELOG.md','RELEASES/v0.15.0-phase15.md'];
for(const name of releaseFiles){
  if(!fs.existsSync(new URL('./'+name, import.meta.url)))failures.push('Missing Phase 15 release file: '+name);
}
if(!fs.existsSync(cspUpdaterUrl))failures.push('Missing CSP hash updater utility');
if(!fs.existsSync(new URL('./prepare-site.mjs', import.meta.url)))failures.push('Missing deterministic production staging utility');
if(!fs.existsSync(securityPrivacyUrl))failures.push('Missing security/privacy trust document');
for(const [label,url] of [
  ['Phase 19 provider schema',phase19SchemaUrl],
  ['Phase 19 provider gateway',phase19GatewayUrl],
  ['Phase 19 provider runtime config',phase19RuntimeUrl],
  ['Phase 19 provider activation README',phase19ReadmeUrl],
  ['Phase 19 implementation document',phase19DocUrl],
  ['Phase 20 money schema',phase20SchemaUrl],
  ['Phase 20 money gateway',phase20GatewayUrl],
  ['Phase 20 money runtime config',phase20RuntimeUrl],
  ['Phase 20 money README',phase20ReadmeUrl],
  ['Phase 20 implementation document',phase20DocUrl],
  ['Phase 21 card event schema',phase21SchemaUrl],
  ['Phase 21 implementation document',phase21DocUrl],
  ['Phase 21 signed money webhook',phase21WebhookUrl],
  ['Phase 21 Unit card authorization controller',phase21CardAuthUrl],
  ['Money Lab HTML',moneyLabHtmlUrl],
  ['Money Lab client',moneyLabJsUrl],
  ['Money Lab checker',moneyLabCheckUrl],
  ['Phase 22 provider sandbox schema',phase22SchemaUrl],
  ['Phase 22 implementation document',phase22DocUrl],
  ['Phase 23 account security schema',phase23SchemaUrl],
  ['Phase 23 implementation document',phase23DocUrl],
  ['Account Gateway',accountGatewayUrl],
  ['Account Center HTML',accountHtmlUrl],
  ['Account Center client',accountJsUrl],
  ['Account Center release config',accountReleaseConfigUrl],
  ['Account Center checker',accountCheckUrl],
  ['Phase 24 implementation document',phase24DocUrl],
  ['Auth production setup guide',authProductionSetupUrl],
  ['Phase 26 return/dispute schema',phase26SchemaUrl],
  ['Phase 26 implementation document',phase26DocUrl],
  ['Phase 27 staff ops schema',phase27SchemaUrl],
  ['Phase 27 implementation document',phase27DocUrl],
  ['Ops Gateway',opsGatewayUrl],
  ['Ops Console HTML',opsHtmlUrl],
  ['Ops Console client',opsJsUrl],
  ['Ops Console checker',opsCheckUrl],
  ['Ops access setup guide',opsAccessSetupUrl],
  ['Phase 28 support/incident schema',phase28SchemaUrl],
  ['Phase 28 implementation document',phase28DocUrl],
  ['Phase 29 monitoring schema',phase29SchemaUrl],
  ['Phase 29 implementation document',phase29DocUrl],
  ['Phase 30 notification dispatcher schema',phase30SchemaUrl],
  ['Phase 30 implementation document',phase30DocUrl],
  ['Phase 30 Ops notifier',opsNotifierUrl],
  ['Phase 30 Ops notifier runtime',opsNotifierRuntimeUrl],
  ['Phase 31 production interlock schema',phase31SchemaUrl],
  ['Phase 31 implementation document',phase31DocUrl],
  ['Phase 32 legal retention schema',phase32SchemaUrl],
  ['Phase 32 implementation document',phase32DocUrl],
  ['Phase 33 privacy export schema',phase33SchemaUrl],
  ['Phase 33 implementation document',phase33DocUrl],
  ['Sandbox legal fixture',legalSandboxUrl],
  ['Sandbox legal fixture checker',legalCheckUrl],
  ['Support Gateway',supportGatewayUrl],
  ['Support Center HTML',supportHtmlUrl],
  ['Support Center client',supportJsUrl],
  ['Support Center checker',supportCheckUrl]
]){
  if(!fs.existsSync(url))failures.push('Missing '+label);
}
const phase19Schema=fs.existsSync(phase19SchemaUrl)?fs.readFileSync(phase19SchemaUrl,'utf8'):'';
const phase19Gateway=fs.existsSync(phase19GatewayUrl)?fs.readFileSync(phase19GatewayUrl,'utf8'):'';
const phase19Readme=fs.existsSync(phase19ReadmeUrl)?fs.readFileSync(phase19ReadmeUrl,'utf8'):'';
const requirePhase19FileText=(label,content,text)=>{if(!content.includes(text))failures.push(label);};
const phase20Schema=fs.existsSync(phase20SchemaUrl)?fs.readFileSync(phase20SchemaUrl,'utf8'):'';
const phase20Gateway=fs.existsSync(phase20GatewayUrl)?fs.readFileSync(phase20GatewayUrl,'utf8'):'';
const phase20Runtime=fs.existsSync(phase20RuntimeUrl)?fs.readFileSync(phase20RuntimeUrl,'utf8'):'';
const phase20Readme=fs.existsSync(phase20ReadmeUrl)?fs.readFileSync(phase20ReadmeUrl,'utf8'):'';
const phase20Doc=fs.existsSync(phase20DocUrl)?fs.readFileSync(phase20DocUrl,'utf8'):'';
const requirePhase20FileText=(label,content,text)=>{if(!content.includes(text))failures.push(label);};
const phase21Schema=fs.existsSync(phase21SchemaUrl)?fs.readFileSync(phase21SchemaUrl,'utf8'):'';
const phase21Doc=fs.existsSync(phase21DocUrl)?fs.readFileSync(phase21DocUrl,'utf8'):'';
const phase21Webhook=fs.existsSync(phase21WebhookUrl)?fs.readFileSync(phase21WebhookUrl,'utf8'):'';
const phase21CardAuth=fs.existsSync(phase21CardAuthUrl)?fs.readFileSync(phase21CardAuthUrl,'utf8'):'';
const moneyLabHtml=fs.existsSync(moneyLabHtmlUrl)?fs.readFileSync(moneyLabHtmlUrl,'utf8'):'';
const moneyLabJs=fs.existsSync(moneyLabJsUrl)?fs.readFileSync(moneyLabJsUrl,'utf8'):'';
const requirePhase21FileText=(label,content,text)=>{if(!content.includes(text))failures.push(label);};
const phase22Schema=fs.existsSync(phase22SchemaUrl)?fs.readFileSync(phase22SchemaUrl,'utf8'):'';
const phase22Doc=fs.existsSync(phase22DocUrl)?fs.readFileSync(phase22DocUrl,'utf8'):'';
const requirePhase22FileText=(label,content,text)=>{if(!content.includes(text))failures.push(label);};
const phase23Schema=fs.existsSync(phase23SchemaUrl)?fs.readFileSync(phase23SchemaUrl,'utf8'):'';
const phase23Doc=fs.existsSync(phase23DocUrl)?fs.readFileSync(phase23DocUrl,'utf8'):'';
const accountGateway=fs.existsSync(accountGatewayUrl)?fs.readFileSync(accountGatewayUrl,'utf8'):'';
const accountHtml=fs.existsSync(accountHtmlUrl)?fs.readFileSync(accountHtmlUrl,'utf8'):'';
const accountJs=fs.existsSync(accountJsUrl)?fs.readFileSync(accountJsUrl,'utf8'):'';
const accountReleaseConfig=fs.existsSync(accountReleaseConfigUrl)?fs.readFileSync(accountReleaseConfigUrl,'utf8'):'';
const phase24Doc=fs.existsSync(phase24DocUrl)?fs.readFileSync(phase24DocUrl,'utf8'):'';
const authProductionSetup=fs.existsSync(authProductionSetupUrl)?fs.readFileSync(authProductionSetupUrl,'utf8'):'';
const requirePhase23FileText=(label,content,text)=>{if(!content.includes(text))failures.push(label);};
const requirePhase24FileText=(label,content,text)=>{if(!content.includes(text))failures.push(label);};
const phase26Schema=fs.existsSync(phase26SchemaUrl)?fs.readFileSync(phase26SchemaUrl,'utf8'):'';
const phase26Doc=fs.existsSync(phase26DocUrl)?fs.readFileSync(phase26DocUrl,'utf8'):'';
const requirePhase26FileText=(label,content,text)=>{if(!content.includes(text))failures.push(label);};
const phase27Schema=fs.existsSync(phase27SchemaUrl)?fs.readFileSync(phase27SchemaUrl,'utf8'):'';
const phase27Doc=fs.existsSync(phase27DocUrl)?fs.readFileSync(phase27DocUrl,'utf8'):'';
const opsGateway=fs.existsSync(opsGatewayUrl)?fs.readFileSync(opsGatewayUrl,'utf8'):'';
const opsHtml=fs.existsSync(opsHtmlUrl)?fs.readFileSync(opsHtmlUrl,'utf8'):'';
const opsJs=fs.existsSync(opsJsUrl)?fs.readFileSync(opsJsUrl,'utf8'):'';
const phase28Schema=fs.existsSync(phase28SchemaUrl)?fs.readFileSync(phase28SchemaUrl,'utf8'):'';
const phase28Doc=fs.existsSync(phase28DocUrl)?fs.readFileSync(phase28DocUrl,'utf8'):'';
const supportGateway=fs.existsSync(supportGatewayUrl)?fs.readFileSync(supportGatewayUrl,'utf8'):'';
const supportHtml=fs.existsSync(supportHtmlUrl)?fs.readFileSync(supportHtmlUrl,'utf8'):'';
const supportJs=fs.existsSync(supportJsUrl)?fs.readFileSync(supportJsUrl,'utf8'):'';
const requirePhase27FileText=(label,content,text)=>{if(!content.includes(text))failures.push(label);};
const requirePhase28FileText=(label,content,text)=>{if(!content.includes(text))failures.push(label);};
const phase29Schema=fs.existsSync(phase29SchemaUrl)?fs.readFileSync(phase29SchemaUrl,'utf8'):'';
const phase29Doc=fs.existsSync(phase29DocUrl)?fs.readFileSync(phase29DocUrl,'utf8'):'';
const requirePhase29FileText=(label,content,text)=>{if(!content.includes(text))failures.push(label);};
const phase30Schema=fs.existsSync(phase30SchemaUrl)?fs.readFileSync(phase30SchemaUrl,'utf8'):'';
const phase30Doc=fs.existsSync(phase30DocUrl)?fs.readFileSync(phase30DocUrl,'utf8'):'';
const opsNotifier=fs.existsSync(opsNotifierUrl)?fs.readFileSync(opsNotifierUrl,'utf8'):'';
const opsNotifierRuntime=fs.existsSync(opsNotifierRuntimeUrl)?fs.readFileSync(opsNotifierRuntimeUrl,'utf8'):'';
const requirePhase30FileText=(label,content,text)=>{if(!content.includes(text))failures.push(label);};
const phase31Schema=fs.existsSync(phase31SchemaUrl)?fs.readFileSync(phase31SchemaUrl,'utf8'):'';
const phase31Doc=fs.existsSync(phase31DocUrl)?fs.readFileSync(phase31DocUrl,'utf8'):'';
const requirePhase31FileText=(label,content,text)=>{if(!content.includes(text))failures.push(label);};
const phase32Schema=fs.existsSync(phase32SchemaUrl)?fs.readFileSync(phase32SchemaUrl,'utf8'):'';
const phase32Doc=fs.existsSync(phase32DocUrl)?fs.readFileSync(phase32DocUrl,'utf8'):'';
const legalSandbox=fs.existsSync(legalSandboxUrl)?fs.readFileSync(legalSandboxUrl,'utf8'):'';
const requirePhase32FileText=(label,content,text)=>{if(!content.includes(text))failures.push(label);};
const phase33Schema=fs.existsSync(phase33SchemaUrl)?fs.readFileSync(phase33SchemaUrl,'utf8'):'';
const phase33Doc=fs.existsSync(phase33DocUrl)?fs.readFileSync(phase33DocUrl,'utf8'):'';
const requirePhase33FileText=(label,content,text)=>{if(!content.includes(text))failures.push(label);};

const requireText=(label,text)=>{if(!html.includes(text))failures.push(label);};
const forbidText=(label,text)=>{if(html.includes(text))failures.push(label);};

requireText('Home renderer','async function renderHome()');
requireText('Details renderer','async function renderDetails()');
requireText('Bills Studio','renderBillsStudio');
requireText('Essentials Runway','renderEssentialsStudio');
requireText('Lifestyle Flex','renderLifestyleStudio');
requireText('Savings Goals','renderSavingsStudio');
requireText('Pre-check','renderPrecheck');
requireText('History','renderHistory');
requireText('Scenario','renderScenario');
requireText('Connected Data','renderConnections');
requireText('Preferences','renderPreferences');
requireText('Plan renderer','renderSetup');
requireText('New Week renderer','renderReset');
requireText('Adaptive constellations','ADAPTIVE WORLDS + CHOREOGRAPHY + CONNECTED DATA v12');
requireText('Route choreography','navigateWithChoreography');
requireText('Phase 2 progressive disclosure','PHASE 2 — PROGRESSIVE DISCLOSURE v14');
requireText('Phase 2 disclosure controller','initZenDisclosure');
requireText('Phase 2 attention override','phase2AttentionOverride');
requireText('Phase 2 More menu','zen-more-menu');
requireText('Phase 3 bottom-sheet system','PHASE 3 — BOTTOM SHEETS + LIGHTWEIGHT INSPECTION v15');
requireText('Phase 3 shared sheet controller','openAppSheet');
requireText('Phase 3 child inspection','phase3ChildSheetModel');
requireText('Phase 3 command expansion','phase3CommandSheetModel');
requireText('Phase 3 swipe dismiss','drag>72');
requireText('Phase 4 semantic motion','PHASE 4 — MOTION DISCIPLINE + SEMANTIC EVENTS v16');
requireText('Phase 4 event queue','queueFinancialEvent');
requireText('Phase 4 Home confirmation','playFinancialEventOnHome');
requireText('Phase 4 visibility discipline','initMotionDiscipline');
requireText('Phase 4 week rebuild event','weekReset');
requireText('Phase 5 Details system map','PHASE 5 — DETAILS SYSTEM MAP v17');
requireText('Phase 5 tool search','systemToolSearch');
requireText('Phase 5 grouped disclosure','system-group');
requireText('Phase 5 Data & History group','Data & history');
requireText('Phase 6 four category worlds','PHASE 6 — FOUR CATEGORY WORLDS v18');
requireText('Phase 6 bill urgency','billUrgencyScore');
requireText('Phase 6 essential pace','spendingLanePace');
requireText('Phase 6 lifestyle soft caps','FLEX_CAPS_KEY');
requireText('Phase 6 savings suggestions','goalSuggestedWeekly');
requireText('Phase 6 targeted pre-check','PRECHECK_HINT_KEY');
requireText('Phase 7 connected data hardening','PHASE 7 — CONNECTED DATA HARDENING v19');
requireText('Phase 7 resilient parser','parseDelimitedText');
requireText('Phase 7 import preview','buildConnectedImportPreview');
requireText('Phase 7 deferred queue',"reviewState='deferred'");
requireText('Phase 7 audit trail','appendConnectedAudit');
requireText('Phase 7 undo import','/transaction/import/reverse-batch');
requireText('Phase 7 reconciliation correction','/transaction/import/reclassify');
requireText('Phase 8 explainable decision support','PHASE 8 — EXPLAINABLE DECISION SUPPORT v20');
requireText('Phase 8 recommendation engine','buildDecisionCandidates');
requireText('Phase 8 primary recommendation','primaryRecommendation');
requireText('Phase 8 suppression','suppressRecommendation');
requireText('Phase 8 explanation registry','How this signal was decided');
requireText('Phase 8 no-action state','No urgent action is being surfaced');
requireText('Phase 9 scenario and weekly memory','PHASE 9 — SCENARIOS + WEEKLY MEMORY + LEARNING LOOPS v21');
requireText('Phase 9 memory trend','memoryTrend');
requireText('Phase 9 learning loop','memoryLearningLoop');
requireText('Phase 9 planned savings streak','plannedSavingsStreak');
requireText('Phase 9 scenario estimator','scenarioEstimate');
requireText('Phase 9 session draft','SCENARIO_DRAFT_KEY');
requireText('Phase 9 preview-only guard','Preview only.');
requireText('Phase 10 personalization and accessibility','PHASE 10 — PERSONALIZATION + ACCESSIBILITY v22');
requireText('Phase 10 system-aware UI preferences','effectiveUiPrefs');
requireText('Phase 10 system preference listeners','bindSystemPreferenceListeners');
requireText('Phase 10 route announcements','announceRoute');
requireText('Phase 10 skip link','Skip to main content');
requireText('Phase 10 visible keyboard focus',':focus-visible');
requireText('Phase 10 comfortable touch targets','data-touch="comfortable"');
requireText('Phase 10 large text','data-text-size="large"');
requireText('Phase 10 modal background inert',"setAttribute('inert','')");
requireText('Phase 11 iPhone compression','PHASE 11 — IPHONE COMPRESSION + DEVICE QA v23');
requireText('Phase 11 visual viewport controller','bindMobileViewportController');
requireText('Phase 11 device QA','runDeviceQa');
requireText('Phase 11 QA route','renderDeviceQA');
requireText('Phase 11 keyboard state','data-keyboard');
requireText('Phase 11 back-navigation state','historyTraversalPending');
requireText('Phase 11 scroll restoration','routeScrollPositions');
requireText('Phase 11 pageshow recovery','pageshow');
forbidText('Phase 11 must allow browser zoom','maximum-scale=1');
requireText('Phase 12 performance and resilience','PHASE 12 — PERFORMANCE + RESILIENCE v24');
requireText('Phase 12 state normalization','normalizeRuntimeState');
requireText('Phase 12 serialized state cache','volatileStateSerialized');
requireText('Phase 12 derived cache','homeSignalsCache');
requireText('Phase 12 history cache','historySummaryCache');
requireText('Phase 12 lazy Home children','phase2WorldChildren');
requireText('Phase 12 listener cleanup','zenDisclosureVisibilityCleanup');
requireText('Phase 12 adaptive tier','runtimePerformanceTier');
requireText('Phase 12 particle cap','maxEventParticles');
requireText('Phase 12 storage monitor','storageFootprint');
requireText('Phase 12 performance diagnostics','renderPerformance');
requireText('Phase 12 route timing','recordRouteRender');
forbidText('Phase 12 forced layout reads','offsetWidth');
requireText('Phase 16 local usage insights','PHASE 16 — LOCAL USAGE INSIGHTS v28');
requireText('Phase 16 local analytics key',"LOCAL_ANALYTICS_KEY='thisweek.analytics.v1'");
requireText('Phase 16 opt-in analytics','setLocalAnalyticsEnabled');
requireText('Phase 16 aggregate recorder','recordLocalUsage');
requireText('Phase 16 category focus metric',"recordLocalUsage('category_focus'");
requireText('Phase 16 studio-open metric',"recordLocalUsage('studio_open'");
requireText('Phase 16 recommendation-open metric',"recordLocalUsage('recommendation_open'");
requireText('Phase 16 task completion metrics','LOCAL_ANALYTICS_TASK_KEYS');
requireText('Phase 16 correction metrics','LOCAL_ANALYTICS_CORRECTION_KEYS');
requireText('Phase 16 analytics dashboard','renderLocalAnalytics');
requireText('Phase 16 no dwell-time tracking','No dwell time');
requireText('Phase 16 no remote analytics','No remote analytics');
requireText('Phase 16 local export','downloadLocalAnalyticsExport');
requireText('Phase 17 product polish and brand system','PHASE 17 — PRODUCT POLISH + BRAND SYSTEM v29');
requireText('Phase 17 canonical surface tokens','--tw-surface-1');
requireText('Phase 17 canonical border tokens','--tw-border-default');
requireText('Phase 17 canonical elevation tokens','--tw-elevation-2');
requireText('Phase 17 canonical radius scale','--tw-radius-md');
requireText('Phase 17 canonical typography roles','--tw-type-body');
requireText('Phase 17 category color tokens','--tw-cat-bills');
requireText('Phase 17 icon construction grid','--tw-icon-grid');
requireText('Phase 17 motion language','--tw-motion-confirm');
requireText('Phase 17 route accent identity','document.body.dataset.view=r');
requireText('Phase 17 unified system state','function systemState(');
requireText('Phase 17 loading state','function loadingState(');
requireText('Phase 17 page error state','function pageState(');
requireText('Phase 17 restrained success confirmation','function successToast(');
requireText('Phase 17 delayed loading guard','phase17LoadingTimer');
requireText('Phase 17 lite-mode finish','body[data-performance="lite"] :where(.section');
requireText('Phase 17 reduced-motion loading state','body[data-motion="reduced"] .state-spinner');
requireText('Phase 18 power-user efficiency','PHASE 18 — POWER-USER EFFICIENCY v30');
requireText('Phase 18 power preferences key',"POWER_PREFS_KEY='thisweek.powerPrefs.v1'");
requireText('Phase 18 default-off direct open','directCategoryOpen:input.directCategoryOpen===true');
requireText('Phase 18 default-off quick add','quickAdd:input.quickAdd===true');
requireText('Phase 18 default-off recent shortcut','recentShortcut:input.recentShortcut===true');
requireText('Phase 18 default-off keyboard','keyboard:input.keyboard===true');
requireText('Phase 18 default-off studio switcher','rapidSwitcher:input.rapidSwitcher===true');
requireText('Phase 18 category direct-open guard','power.directCategoryOpen');
requireText('Phase 18 quick amount prefill','class="power-quick-add"');
requireText('Phase 18 quick add prefill disclosure','Quick amount · prefill only');
requireText('Phase 18 pinned Details shortcut','class="power-dock"');
requireText('Phase 18 recent tool memory','rememberRecentTool');
requireText('Phase 18 keyboard chords','function bindPowerKeyboard()');
requireText('Phase 18 rapid studio switcher','function powerStudioSwitcher(active)');
requireText('Phase 18 Details ordering','POWER_DETAILS_DEFAULT_ORDER');
requireText('Phase 18 power toggle controls','data-power-toggle');
requireText('Phase 18 power privacy inventory','Optional power-user navigation and efficiency preferences; no financial amounts');
requireText('Phase 18 cross-tab power invalidation',"if(e.key===POWER_PREFS_KEY)powerPrefsCache=null");
requireText('Phase 18 no permanent Home power panel','Every shortcut below is off by default.');

requireText('Phase 19 secure provider gateway','PHASE 19 — SECURE PROVIDER GATEWAY v31');
requireText('Phase 19 client config','const LIVE_PROVIDER_CONFIG=Object.freeze({');
requireText('Phase 19 default disabled provider','enabled:false');
requireText('Phase 19 backend origin',"backendOrigin:'https://xjtvawmppzwzrooairyx.supabase.co'");
requireText('Phase 19 auth-provider deny rule',"networkPolicy:'deny_until_auth_and_provider'");
requireText('Phase 19 readiness controller','function liveProviderReadiness()');
requireText('Phase 19 provider record mapper','function providerTransactionToConnectedRecord(row={})');
requireText('Phase 19 disabled connect control','id="connectFinancialProvider"');
requireText('Phase 19 provisioned status copy','Provider backend provisioned · no live institution connection is active.');
requireText('Phase 19 explicit provider flow','Provider → Server Sync → Review → Reconcile → Weekly Transaction');
requireText('Phase 19 external balance boundary','External balances stay external.');
requireText('Phase 19 trust activation test','Phase 19 activation gate');
requireText('Phase 19 staged transport',"transport:'staged_https_json'");
requireText('Phase 19 staged auth state',"current:'staged_not_active'");
requireText('Phase 19 provisioned project ref',"projectRef:'xjtvawmppzwzrooairyx'");
requirePhase19FileText('Phase 19 schema consent table',phase19Schema,'tw_provider_consents');
requirePhase19FileText('Phase 19 schema connections table',phase19Schema,'tw_provider_connections');
requirePhase19FileText('Phase 19 schema accounts table',phase19Schema,'tw_provider_accounts');
requirePhase19FileText('Phase 19 schema transaction table',phase19Schema,'tw_provider_transactions');
requirePhase19FileText('Phase 19 schema conflicts table',phase19Schema,'tw_provider_conflicts');
requirePhase19FileText('Phase 19 schema RLS',phase19Schema,'enable row level security');
requirePhase19FileText('Phase 19 schema denies authenticated direct table access',phase19Schema,'from public, anon, authenticated');
requirePhase19FileText('Phase 19 external balance schema warning',phase19Schema,'must never be substituted for This Week Available Now');
requirePhase19FileText('Phase 19 gateway pinned Supabase client',phase19Gateway,'npm:@supabase/supabase-js@2.95.0');
requirePhase19FileText('Phase 19 gateway service Vault bridge',phase19Gateway,'admin.rpc("tw_vault_create"');
requirePhase19FileText('Phase 19 gateway authenticated user validation',phase19Gateway,'auth.getUser(token)');
requirePhase19FileText('Phase 19 gateway Vault create',phase19Gateway,'tw_vault_create');
requirePhase19FileText('Phase 19 gateway Vault read',phase19Gateway,'tw_vault_read');
requirePhase19FileText('Phase 19 gateway Hosted Link',phase19Gateway,'hosted_link');
requirePhase19FileText('Phase 19 gateway modern Link results',phase19Gateway,'item_add_results');
requirePhase19FileText('Phase 19 gateway token exchange',phase19Gateway,'/item/public_token/exchange');
requirePhase19FileText('Phase 19 gateway transactions sync',phase19Gateway,'/transactions/sync');
requirePhase19FileText('Phase 19 gateway provider disconnect',phase19Gateway,'/item/remove');
requirePhase19FileText('Phase 19 gateway no-store response',phase19Gateway,'"Cache-Control": "no-store"');
requirePhase19FileText('Phase 19 activation sequence',phase19Readme,'Remaining activation gates');
requirePhase19FileText('Phase 19 shared project isolation rule',phase19Readme,'BennyBundles’s Project');

// Phase 20 money-layer foundation must remain fail-closed in the browser.
requireText('Phase 20 money client config','const LIVE_MONEY_CONFIG=Object.freeze({');
requireText('Phase 20+ money backend deployed',"state:'sandbox_chain_deployed_credential_gated'");
requireText('Phase 20 client execution disabled',"executionMode:'disabled'");
requireText('Phase 20 money network deny rule',"networkPolicy:'deny_until_sandbox_auth_and_credentials'");
requireText('Phase 20 inactive reward disclosure',"rewardMode:'sandbox_template_inactive'");
requireText('Phase 20 readiness controller','function liveMoneyReadiness()');
requireText('Phase 20 Money Center route','async function renderMoneyCenter()');
requireText('Phase 20 direct deposit route','async function renderDirectDeposit()');
requireText('Phase 20 bill pay route','async function renderBillPay()');
requireText('Phase 20 category cards route','async function renderCategoryCards()');
requireText('Phase 20 planning custody boundary','Planning stays separate from custody.');
requireText('Phase 20 bill payment semantic boundary','Protected ≠ paid');
requirePhase20FileText('Phase 20 schema customers table',phase20Schema,'tw_money_customers');
requirePhase20FileText('Phase 20 schema journal table',phase20Schema,'tw_money_journals');
requirePhase20FileText('Phase 20 schema ledger entries',phase20Schema,'tw_money_ledger_entries');
requirePhase20FileText('Phase 20 schema funding accounts',phase20Schema,'tw_money_funding_accounts');
requirePhase20FileText('Phase 20 schema direct deposit switches',phase20Schema,'tw_money_direct_deposit_switches');
requirePhase20FileText('Phase 20 schema rewards',phase20Schema,'tw_money_reward_offers');
requirePhase20FileText('Phase 20 schema bill payments',phase20Schema,'tw_money_bill_payments');
requirePhase20FileText('Phase 20 schema virtual cards',phase20Schema,'tw_money_virtual_cards');
requirePhase20FileText('Phase 20 schema provider event inbox',phase20Schema,'tw_money_provider_events');
requirePhase20FileText('Phase 20 schema RLS',phase20Schema,'enable row level security');
requirePhase20FileText('Phase 20 schema browser grants revoked',phase20Schema,'from public, anon, authenticated');
requirePhase20FileText('Phase 20 append-only history trigger',phase20Schema,'reject_money_history_mutation');
requirePhase20FileText('Phase 20 balanced journal guard',phase20Schema,"if v_sum <> 0 then raise exception 'journal_not_balanced'");
requirePhase20FileText('Phase 20 atomic balance move',phase20Schema,'insufficient_ledger_balance');
requirePhase20FileText('Phase 20 inactive sandbox reward',phase20Schema,"'TW_DD_SWITCH_25_SANDBOX'");
requirePhase20FileText('Phase 20 sandbox reward forced inactive',phase20Schema,'active=false');
requirePhase20FileText('Phase 20 gateway pinned Supabase client',phase20Gateway,'npm:@supabase/supabase-js@2.95.0');
requirePhase20FileText('Phase 20 gateway validates authenticated user',phase20Gateway,'auth.getUser(token)');
requirePhase20FileText('Phase 20 gateway rejects anonymous users',phase20Gateway,'recoverable_auth_required');
requirePhase20FileText('Phase 20 gateway execution lock',phase20Gateway,'THISWEEK_MONEY_EXECUTION_MODE');
requirePhase20FileText('Phase 20 gateway live money lock',phase20Gateway,'THISWEEK_LIVE_MONEY_ENABLED');
requirePhase20FileText('Phase 20 gateway Unit adapter',phase20Gateway,'api.s.unit.sh');
requirePhase20FileText('Phase 20 gateway Pinwheel version',phase20Gateway,'2025-07-08');
requirePhase20FileText('Phase 20 gateway Method adapter',phase20Gateway,'/payments');
requirePhase20FileText('Phase 20 gateway allocation via ledger RPC',phase20Gateway,'tw_money_move_balance');
requirePhase20FileText('Phase 20 gateway no-store response',phase20Gateway,'"Cache-Control": "no-store"');
requirePhase20FileText('Phase 20 gateway MFA production gate',phase20Gateway,'mfa_aal2_required');
requirePhase20FileText('Phase 20 runtime strict mode',phase20Runtime,'"strict": true');
requirePhase20FileText('Phase 20 README no live money',phase20Readme,'No live money is currently moved.');
requirePhase20FileText('Phase 20 implementation Plan authority',phase20Doc,'Available Now` remains plan-derived.');

// Phase 21 signed external events + isolated recoverable Auth lab.
requireText('Phase 21 money state',"state:'sandbox_chain_deployed_credential_gated'");
requireText('Phase 21 signed webhook readiness',"webhookMode:'signed_receivers_deployed'");
requireText('Phase 21 card controller readiness',"cardAuthorizationMode:'controller_deployed_execution_locked'");
requireText('Phase 21 Money Lab link','href="./money-lab/"');
requirePhase21FileText('Phase 21 reserve card RPC',phase21Schema,'tw_money_reserve_card_authorization');
requirePhase21FileText('Phase 21 release card RPC',phase21Schema,'tw_money_release_card_authorization');
requirePhase21FileText('Phase 21 settle card RPC',phase21Schema,'tw_money_settle_card_authorization');
requirePhase21FileText('Phase 21 partial approval',phase21Schema,'partial_approval');
requirePhase21FileText('Phase 21 atomic card hold',phase21Schema,'card_authorization_hold');
requirePhase21FileText('Phase 21 signed event flag',phase21Schema,'signature_verified');
requirePhase21FileText('Phase 21 RPC browser revocation',phase21Schema,'from public,anon,authenticated');
requirePhase21FileText('Phase 21 Unit raw HMAC SHA1',phase21Webhook,'"SHA-1"');
requirePhase21FileText('Phase 21 Pinwheel v2 signature',phase21Webhook,'"v2:" + timestamp + ":"');
requirePhase21FileText('Phase 21 Method HMAC signature',phase21Webhook,'method-webhook-signature');
requirePhase21FileText('Phase 21 Method timestamp freshness',phase21Webhook,'> 300');
requirePhase21FileText('Phase 21 webhook payload hash',phase21Webhook,'sha256Hex');
requirePhase21FileText('Phase 21 Unit controller signature required',phase21CardAuth,'x-unit-signature');
requirePhase21FileText('Phase 21 Unit controller fail closed',phase21CardAuth,'return decline("RestrictedCard")');
requirePhase21FileText('Phase 21 Unit approval response',phase21CardAuth,'approveAuthorizationRequest');
requirePhase21FileText('Phase 21 Unit decline response',phase21CardAuth,'declineAuthorizationRequest');
requirePhase21FileText('Phase 21 Money Lab exact allowlist',moneyLabHtml,'connect-src https://xjtvawmppzwzrooairyx.supabase.co');
requirePhase21FileText('Phase 21 Money Lab publishable key',moneyLabJs,'sb_publishable_');
requirePhase21FileText('Phase 21 Money Lab signup',moneyLabJs,"/auth/v1/signup");
requirePhase21FileText('Phase 21 Money Lab MFA enroll',moneyLabJs,"/auth/v1/factors");
requirePhase21FileText('Phase 21 Money Lab gateway call',moneyLabJs,'/functions/v1/thisweek-money-gateway');
requirePhase21FileText('Phase 21 Money Lab tab scoped session',moneyLabJs,'sessionStorage');
if(/service_role|sb_secret_/i.test(moneyLabHtml+moneyLabJs))failures.push('Phase 21 Money Lab contains a server secret pattern');
if(/localStorage/.test(moneyLabJs))failures.push('Phase 21 Money Lab persists auth state to localStorage');

// Phase 22 credential-gated provider Sandbox orchestration.
requireText('Phase 22 sandbox chain marker',"sandboxChain:'plaid_unit_pinwheel_method'");
requireText('Phase 22 sandbox chain credential gate',"sandboxChainMode:'deployed_credentials_required'");
requirePhase22FileText('Phase 22 Unit application schema',phase22Schema,'provider_application_id');
requirePhase22FileText('Phase 22 Method entity schema',phase22Schema,'method_entity_id');
requirePhase22FileText('Phase 22 funding link kind',phase22Schema,'unit_counterparty');
requirePhase22FileText('Phase 22 Method source kind',phase22Schema,'method_source');
requirePhase22FileText('Phase 22 no secret persistence statement',phase22Doc,'does not invent or commit credentials');
requirePhase20FileText('Phase 22 gateway Plaid processor token',phase20Gateway,'/processor/token/create');
requirePhase20FileText('Phase 22 gateway Unit processor selector',phase20Gateway,'processor: "unit"');
requirePhase20FileText('Phase 22 gateway Unit application',phase20Gateway,'unit_sandbox_application');
requirePhase20FileText('Phase 22 gateway Unit deposit account',phase20Gateway,'unit_create_deposit_account');
requirePhase20FileText('Phase 22 gateway external ACH funding',phase20Gateway,'unit_fund_from_external');
requirePhase20FileText('Phase 22 gateway Unit authorization simulation',phase20Gateway,'unit_sandbox_authorization');
requirePhase20FileText('Phase 22 gateway Method dev setup',phase20Gateway,'method_sandbox_setup');
requirePhase20FileText('Phase 22 gateway Method payment',phase20Gateway,'method_sandbox_payment');
requirePhase19FileText('Phase 22 provider gateway Plaid Auth',phase19Gateway,'products: ["auth", "transactions"]');
requirePhase19FileText('Phase 22 provider gateway rejects anonymous',phase19Gateway,'recoverable_auth_required');
requirePhase21FileText('Phase 22 Unit webhook application state',phase21Webhook,'unitApplicationState');
requirePhase21FileText('Phase 22 Unit webhook ACH cash credit',phase21Webhook,'unit_ach_credit_settlement');
requirePhase21FileText('Phase 22 Unit webhook transfer state',phase21Webhook,'unitPaymentState');
requirePhase21FileText('Phase 22 Money Lab Pinwheel v4',moneyLabHtml,'https://cdn.getpinwheel.com/pinwheel-v4.js');
requirePhase21FileText('Phase 22 Money Lab provider gateway',moneyLabJs,'/functions/v1/thisweek-provider-gateway');
requirePhase21FileText('Phase 22 Money Lab Plaid Unit action',moneyLabJs,"gateway('plaid_unit_funding_link'");
requirePhase21FileText('Phase 22 Money Lab card simulation',moneyLabJs,"gateway('unit_sandbox_authorization'");
requirePhase21FileText('Phase 22 Money Lab Pinwheel open',moneyLabJs,'window.Pinwheel.open');
requirePhase21FileText('Phase 22 Money Lab Method setup',moneyLabJs,"gateway('method_sandbox_setup'");
requirePhase21FileText('Phase 22 Money Lab Method pay',moneyLabJs,"gateway('method_sandbox_payment'");
requirePhase20FileText('Phase 22 Unit webhook registration type split',phase20Gateway,'"OnlyAuthorizationRequest"');
requirePhase20FileText('Phase 22 Unit general webhook registration',phase20Gateway,'"NotAuthorizationRequest"');
requirePhase20FileText('Phase 22 Pinwheel webhook registration',phase20Gateway,'"direct_deposit_allocations.added"');
requirePhase20FileText('Phase 22 Method webhook auth token',phase20Gateway,'METHOD_WEBHOOK_AUTH_TOKEN');
requirePhase20FileText('Phase 22 Method webhook HMAC secret',phase20Gateway,'METHOD_WEBHOOK_HMAC_SECRET');
requirePhase20FileText('Phase 22 webhook action credential gated',phase20Gateway,'register_sandbox_webhooks');
requirePhase21FileText('Phase 22 Lab webhook action',moneyLabJs,"gateway('register_sandbox_webhooks')");

requirePhase20FileText('Phase 22 provider preflight action',phase20Gateway,'provider_preflight');
requirePhase20FileText('Phase 22 preflight Plaid endpoint',phase20Gateway,'/institutions/get');
requirePhase20FileText('Phase 22 preflight Unit endpoint',phase20Gateway,'/applications?page[limit]=1');
requirePhase20FileText('Phase 22 preflight Pinwheel endpoint',phase20Gateway,'/v1/platforms?limit=1');
requirePhase20FileText('Phase 22 preflight Method endpoint',phase20Gateway,'/entities?page=1&page_limit=1');
requirePhase20FileText('Phase 22 preflight execution lock',phase20Gateway,'if (MONEY_EXECUTION_MODE !== "sandbox") return result');
requirePhase21FileText('Phase 22 Lab preflight control',moneyLabHtml,'id="providerPreflight"');
requirePhase21FileText('Phase 22 Lab preflight renderer',moneyLabJs,'renderProviderChecks');
requirePhase21FileText('Phase 22 Lab provider-aware controls',moneyLabJs,'applyProviderControlState');
requirePhase21FileText('Phase 22 Lab preflight action',moneyLabJs,"gateway('provider_preflight')");

requireText('Phase 23 Account Center link',"externalTool('./account/'");
requirePhase23FileText('Phase 23 session boolean RPC',phase23Schema,'tw_auth_session_active');
requirePhase23FileText('Phase 23 closure request table',phase23Schema,'tw_account_closure_requests');
requirePhase23FileText('Phase 23 session RPC browser revocation',phase23Schema,'from public, anon, authenticated');
requirePhase23FileText('Phase 23 Account Gateway session validation',accountGateway,'tw_auth_session_active');
requirePhase23FileText('Phase 23 Account Gateway hard delete',accountGateway,'auth.admin.deleteUser');
requirePhase23FileText('Phase 23 Account Gateway retention review',accountGateway,'retention_review_required');
requirePhase23FileText('Phase 23 Account Gateway Vault cleanup',accountGateway,'tw_vault_delete');
requirePhase23FileText('Phase 23 Account Center exact allowlist',accountHtml,'connect-src https://xjtvawmppzwzrooairyx.supabase.co');
requirePhase23FileText('Phase 23 Account Center recovery',accountJs,'/auth/v1/recover');
requirePhase23FileText('Phase 23 Account Center global signout',accountJs,'/auth/v1/logout?scope=global');
requirePhase23FileText('Phase 23 Account Center shared auth key',accountJs,'thisweek.auth.session.v1');
requirePhase23FileText('Phase 23 Account Center deletion action',accountJs,"accountGateway('delete_account'");
requirePhase20FileText('Phase 23 money gateway active-session check',phase20Gateway,'tw_auth_session_active');
requirePhase19FileText('Phase 23 provider gateway active-session check',phase19Gateway,'tw_auth_session_active');
requirePhase21FileText('Phase 23 Money Lab shared auth key',moneyLabJs,'thisweek.auth.session.v1');
if(/service_role|sb_secret_/i.test(accountHtml+accountJs))failures.push('Phase 23 Account Center contains a server secret pattern');
if(/localStorage/.test(accountJs))failures.push('Phase 23 Account Center persists auth state to localStorage');

requirePhase24FileText('Phase 24 canonical account URL',accountReleaseConfig,'https://bennybundles.github.io/Thisweekmvp/account/');
requirePhase24FileText('Phase 24 recovery redirect',accountReleaseConfig,'?mode=recovery');
requirePhase24FileText('Phase 24 public readiness declaration',accountReleaseConfig,'publicAuthReady:');
requirePhase24FileText('Phase 24 Turnstile provider declaration',accountReleaseConfig,"provider:'turnstile'");
requirePhase23FileText('Phase 24 release config script',accountHtml,'./release-config.js');
requirePhase23FileText('Phase 24 CAPTCHA CSP',accountHtml,'https://challenges.cloudflare.com');
requirePhase23FileText('Phase 24 release readiness UI',accountHtml,'authReleaseGates');
requirePhase23FileText('Phase 24 Supabase CAPTCHA metadata',accountJs,'gotrue_meta_security');
requirePhase23FileText('Phase 24 canonical confirmation redirect',accountJs,'CONFIRM_REDIRECT');
requirePhase23FileText('Phase 24 canonical recovery redirect',accountJs,'RECOVERY_REDIRECT');
requirePhase23FileText('Phase 24 signup cooldown',accountJs,"assertCooldown('signup',60000");
requirePhase23FileText('Phase 24 recovery cooldown',accountJs,"assertCooldown('recover',60000");
requirePhase23FileText('Phase 24 readiness renderer',accountJs,'renderReleaseReadiness');
requirePhase24FileText('Phase 24 doc fail-closed readiness',phase24Doc,'public Auth readiness');
requirePhase24FileText('Phase 24 setup exact redirect',authProductionSetup,'https://bennybundles.github.io/Thisweekmvp/account/?mode=recovery');
if(/service_role|sb_secret_/i.test(accountReleaseConfig))failures.push('Phase 24 public Auth config contains a server secret pattern');


requireText('Phase 26 operations readiness',"operationsMode:'returns_disputes_negative_balance_deployed'");
requirePhase26FileText('Phase 26 ops case table',phase26Schema,'tw_ops_cases');
requirePhase26FileText('Phase 26 append-only case events',phase26Schema,'tw_ops_case_events');
requirePhase26FileText('Phase 26 ACH return RPC',phase26Schema,'tw_money_apply_unit_ach_return');
requirePhase26FileText('Phase 26 card credit RPC',phase26Schema,'tw_money_apply_unit_card_credit');
requirePhase26FileText('Phase 26 dispute RPC',phase26Schema,'tw_ops_record_unit_dispute');
requirePhase26FileText('Phase 26 browser roles revoked',phase26Schema,'from public,anon,authenticated');
requirePhase21FileText('Phase 26 signed Unit ACH return handler',phase21Webhook,'tw_money_apply_unit_ach_return');
requirePhase21FileText('Phase 26 signed Unit dispute handler',phase21Webhook,'tw_ops_record_unit_dispute');
requirePhase21FileText('Phase 26 signed card credit handler',phase21Webhook,'tw_money_apply_unit_card_credit');
requirePhase21FileText('Phase 26 stronger controls preserved',phase21Webhook,'negative_provider_balance');
requirePhase20FileText('Phase 26 operations status action',phase20Gateway,'ops_status');
requirePhase20FileText('Phase 26 Sandbox dispute create',phase20Gateway,'unit_sandbox_create_dispute');
requirePhase20FileText('Phase 26 Sandbox dispute advance',phase20Gateway,'unit_sandbox_dispute_action');
requirePhase21FileText('Phase 26 Lab operations control',moneyLabHtml,'id="opsStatus"');
requirePhase21FileText('Phase 26 Lab dispute create control',moneyLabHtml,'id="createDispute"');
requirePhase21FileText('Phase 26 Lab operations renderer',moneyLabJs,'renderOpsStatus');
requirePhase26FileText('Phase 26 production boundary',phase26Doc,"connect-src 'none'");

// Phase 27 staff operations and RBAC.
requirePhase27FileText('Phase 27 staff action table',phase27Schema,'tw_ops_staff_actions');
requirePhase27FileText('Phase 27 alert table',phase27Schema,'tw_ops_alerts');
requirePhase27FileText('Phase 27 staff roles',phase27Doc,'support_ops');
requirePhase27FileText('Phase 27 app metadata role source',opsGateway,'app_metadata');
requirePhase27FileText('Phase 27 active session check',opsGateway,'tw_auth_session_active');
requirePhase27FileText('Phase 27 AAL2 requirement',opsGateway,'mfa_aal2_required');
requirePhase27FileText('Phase 27 no role assignment doctrine',opsHtml,'No browser role escalation');
requirePhase27FileText('Phase 27 staff audit UI',opsJs,'renderAudit');

// Phase 28 customer support + incident monitoring.
requireText('Phase 28 Support Center link',"externalTool('./support/'");
requirePhase28FileText('Phase 28 support request table',phase28Schema,'tw_support_requests');
requirePhase28FileText('Phase 28 support messages table',phase28Schema,'tw_support_messages');
requirePhase28FileText('Phase 28 incident table',phase28Schema,'tw_ops_incidents');
requirePhase28FileText('Phase 28 internal SLA table',phase28Schema,'tw_ops_sla_policies');
requirePhase28FileText('Phase 28 SLA not public promise',phase28Schema,'public_commitment');
requirePhase28FileText('Phase 28 browser access revoked',phase28Schema,'from public,anon,authenticated');
requirePhase28FileText('Phase 28 append-only support messages',phase28Schema,'tw_support_messages_immutable');
requirePhase28FileText('Phase 28 support gateway auth',supportGateway,'auth.getUser(token)');
requirePhase28FileText('Phase 28 support active session',supportGateway,'tw_auth_session_active');
requirePhase28FileText('Phase 28 support no direct money mutation',phase28Doc,'never directly');
requirePhase28FileText('Phase 28 sensitive number rejection',supportGateway,'\\d{12,19}');
requirePhase27FileText('Phase 28 Ops support action',opsGateway,'support_reply');
requirePhase27FileText('Phase 28 Ops incident action',opsGateway,'open_incident');
requirePhase27FileText('Phase 28 Ops health calculation',opsGateway,'buildHealth');
requirePhase27FileText('Phase 28 Ops support renderer',opsJs,'renderSupport');
requirePhase27FileText('Phase 28 Ops incident renderer',opsJs,'renderIncidents');

requirePhase29FileText('Phase 29 health snapshot table',phase29Schema,'tw_ops_health_snapshots');
requirePhase29FileText('Phase 29 monitor run table',phase29Schema,'tw_ops_monitor_runs');
requirePhase29FileText('Phase 29 notification outbox',phase29Schema,'tw_ops_notification_outbox');
requirePhase29FileText('Phase 29 monitor RPC',phase29Schema,'tw_ops_monitor_tick');
requirePhase29FileText('Phase 29 cron schedule',phase29Schema,'thisweek-phase29-health-monitor');
requirePhase29FileText('Phase 29 direct browser access revoked',phase29Schema,'from public,anon,authenticated');
requirePhase27FileText('Phase 29 Ops dashboard automation',opsGateway,'automatedMonitor');
requirePhase27FileText('Phase 29 manual monitor staff action',opsGateway,'run_monitor');
requirePhase27FileText('Phase 29 notification suppression',opsGateway,'suppress_notification');
requirePhase27FileText('Phase 29 automation renderer',opsJs,'renderAutomation');
requirePhase29FileText('Phase 29 external channel disclosure',phase29Doc,'external paging channel still intentionally unconfigured');

requirePhase30FileText('Phase 30 dispatch nonce table',phase30Schema,'tw_ops_dispatch_nonces');
requirePhase30FileText('Phase 30 channel status table',phase30Schema,'tw_ops_notification_channel_status');
requirePhase30FileText('Phase 30 notification claim RPC',phase30Schema,'tw_ops_claim_notifications');
requirePhase30FileText('Phase 30 notification completion RPC',phase30Schema,'tw_ops_complete_notification');
requirePhase30FileText('Phase 30 one-time nonce consume RPC',phase30Schema,'tw_ops_consume_dispatch_nonce');
requirePhase30FileText('Phase 30 cron dispatcher',phase30Schema,'thisweek-phase30-notification-dispatcher');
requirePhase30FileText('Phase 30 browser roles revoked',phase30Schema,'from public,anon,authenticated');
requirePhase30FileText('Phase 30 notifier destination env',opsNotifier,'THISWEEK_OPS_NOTIFICATION_WEBHOOK_URL');
requirePhase30FileText('Phase 30 notifier nonce auth',opsNotifier,'tw_ops_consume_dispatch_nonce');
requirePhase30FileText('Phase 30 notifier claim lease',opsNotifier,'tw_ops_claim_notifications');
requirePhase30FileText('Phase 30 notifier completion',opsNotifier,'tw_ops_complete_notification');
requirePhase30FileText('Phase 30 notifier fail closed',opsNotifier,'notification_webhook_not_configured');
requirePhase30FileText('Phase 30 notifier HTTPS-only destination',opsNotifier,'u.protocol!=="https:"');
requirePhase27FileText('Phase 30 Ops channel status',opsGateway,'tw_ops_notification_channel_status');
requirePhase30FileText('Phase 30 no false paging claim',phase30Doc,'delivery channel remains unconfigured and fail-closed');
if(/service_role|SUPABASE_SERVICE_ROLE_KEY|sb_secret_/i.test(opsNotifierRuntime))failures.push('Phase 30 notifier runtime config contains a server secret pattern');

requirePhase31FileText('Phase 31 release gates table',phase31Schema,'tw_release_gates');
requirePhase31FileText('Phase 31 release events table',phase31Schema,'tw_release_gate_events');
requirePhase31FileText('Phase 31 release status RPC',phase31Schema,'tw_release_status');
requirePhase31FileText('Phase 31 live-money interlock RPC',phase31Schema,'tw_release_money_enabled');
requirePhase31FileText('Phase 31 admin-only gate setter',phase31Schema,'tw_release_set_gate');
requirePhase31FileText('Phase 31 browser release access revoked',phase31Schema,'from public,anon,authenticated');
requirePhase31FileText('Phase 31 immutable release evidence',phase31Schema,'tw_release_gate_events_immutable');
requirePhase20FileText('Phase 31 money gateway provider interlock',phase20Gateway,'requireProductionReleaseInterlock');
requirePhase19FileText('Phase 31 provider gateway interlock',phase19Gateway,'requireProviderProductionInterlock');
requirePhase21FileText('Phase 31 signed webhook interlock',phase21Webhook,'production_release_gates_incomplete');
requirePhase21FileText('Phase 31 card auth interlock',phase21CardAuth,'tw_release_money_enabled');
requirePhase27FileText('Phase 31 Ops release status',opsGateway,'tw_release_status');
requirePhase27FileText('Phase 31 Ops gate action',opsGateway,'set_release_gate');
requirePhase27FileText('Phase 31 Ops release UI',opsHtml,'id="releaseStatus"');
requirePhase27FileText('Phase 31 Ops release renderer',opsJs,'renderReleaseStatus');
requirePhase31FileText('Phase 31 current state locked',phase31Doc,'live money ready: false');

requirePhase32FileText('Phase 32 legal document registry',phase32Schema,'tw_legal_documents');
requirePhase32FileText('Phase 32 acceptance receipts',phase32Schema,'tw_legal_acceptances');
requirePhase32FileText('Phase 32 retention registry',phase32Schema,'tw_retention_policies');
requirePhase32FileText('Phase 32 sensitive access audit',phase32Schema,'tw_sensitive_access_events');
requirePhase32FileText('Phase 32 immutable acceptance receipts',phase32Schema,'tw_legal_acceptances_immutable');
requirePhase32FileText('Phase 32 immutable access audit',phase32Schema,'tw_sensitive_access_events_immutable');
requirePhase32FileText('Phase 32 browser roles revoked',phase32Schema,'from public,anon,authenticated');
requirePhase32FileText('Phase 32 per-user production legal RPC',phase32Schema,'tw_user_production_legal_ready');
requirePhase32FileText('Phase 32 production legal release gate',phase32Schema,'productionLegalSetActive');
requirePhase32FileText('Phase 32 production retention release gate',phase32Schema,'productionRetentionPolicyActive');
requirePhase32FileText('Phase 32 access-audit release gate',phase32Schema,'sensitiveAccessAuditActive');
requirePhase32FileText('Phase 32 account legal action',accountGateway,'accept_legal');
requirePhase32FileText('Phase 32 account legal status',accountGateway,'tw_legal_status');
requirePhase32FileText('Phase 32 Account Center disclosure list',accountHtml,'id="legalList"');
requirePhase32FileText('Phase 32 Account Center legal renderer',accountJs,'renderLegal');
requirePhase32FileText('Phase 32 Money Gateway user legal gate',phase20Gateway,'production_legal_acceptance_required');
requirePhase32FileText('Phase 32 Provider Gateway user legal gate',phase19Gateway,'production_legal_acceptance_required');
requirePhase32FileText('Phase 32 card authorization legal gate',phase21CardAuth,'tw_user_production_legal_ready');
requirePhase32FileText('Phase 32 Ops sensitive access audit',opsGateway,'tw_sensitive_access_record');
requirePhase32FileText('Phase 32 Ops legal administration',opsGateway,'set_legal_document_state');
requirePhase32FileText('Phase 32 Ops retention administration',opsGateway,'set_retention_policy_state');
requirePhase32FileText('Phase 32 Ops legal retention surface',opsHtml,'id="legalRetention"');
requirePhase32FileText('Phase 32 Ops legal retention renderer',opsJs,'renderLegalRetention');
requirePhase32FileText('Phase 32 Sandbox-only fixture',legalSandbox,'SANDBOX TEST ONLY.');
requirePhase32FileText('Phase 32 production templates remain inactive',phase32Doc,'inactive/unapproved');

requirePhase33FileText('Phase 33 export audit table',phase33Schema,'tw_privacy_export_events');
requirePhase33FileText('Phase 33 immutable export audit',phase33Schema,'tw_privacy_export_events_immutable');
requirePhase33FileText('Phase 33 browser access revoked',phase33Schema,'from public,anon,authenticated');
requirePhase33FileText('Phase 33 inventory action',accountGateway,'privacy_inventory');
requirePhase33FileText('Phase 33 export start action',accountGateway,'privacy_export_start');
requirePhase33FileText('Phase 33 paginated export action',accountGateway,'privacy_export_page');
requirePhase33FileText('Phase 33 completion audit action',accountGateway,'privacy_export_complete');
requirePhase33FileText('Phase 33 fixed dataset allowlist',accountGateway,'PRIVACY_DATASETS');
requirePhase33FileText('Phase 33 page-size cap',accountGateway,'Math.min(500');
requirePhase33FileText('Phase 33 excludes Vault/provider secrets',accountGateway,'provider_credentials_and_vault_secrets');
requirePhase33FileText('Phase 33 export surface',accountHtml,'id="downloadCloudExport"');
requirePhase33FileText('Phase 33 client-side assembly',accountJs,'thisweek.cloud-export.v1');
requirePhase33FileText('Phase 33 page loop',accountJs,"accountGateway('privacy_export_page'");
requirePhase33FileText('Phase 33 local Plan separation',accountHtml,'Export local Plan data');
requirePhase33FileText('Phase 33 statutory scope disclaimer',phase33Doc,'not represented as a guarantee');

requirePhase28FileText('Phase 28 Support Center gateway',supportJs,'/functions/v1/thisweek-support-gateway');
if(/service_role|sb_secret_/i.test(supportHtml+supportJs))failures.push('Phase 28 Support Center contains server-secret pattern');
if(/localStorage/.test(supportJs))failures.push('Phase 28 Support Center must not use localStorage');



requireText('Phase 13 normalized data model','PHASE 13 — NORMALIZED DATA MODEL + BACKEND READINESS v25');
requireText('Phase 13 core schema marker','CORE_SCHEMA_VERSION = 3');
requireText('Phase 13 V1 migration','migrateCoreStateV1ToV2');
requireText('Phase 13 V2 migration','migrateCoreStateV2ToV3');
requireText('Phase 13 normalized entity manifest','NORMALIZED_ENTITY_MANIFEST');
requireText('Phase 13 provider-neutral adapter contract','PROVIDER_ADAPTER_CONTRACT');
requireText('Phase 13 normalized model builder','buildNormalizedDataModel');
requireText('Phase 13 portable envelope','buildPortableDataEnvelope');
requireText('Phase 13 export validation','validatePortableDataEnvelope');
requireText('Phase 13 serialization','serializePortableData');
requireText('Phase 13 deserialization','deserializePortableData');
requireText('Phase 13 JSON export','downloadPortableDataExport');
requireText('Phase 13 data model route','renderDataModel');
requireText('Phase 13 no browser provider secrets','Provider credentials and access tokens must never be stored in this browser-local model.');
requireText('Phase 13 backend sync contract','BACKEND_SYNC_CONTRACT_VERSION=1');
requireText('Phase 13 schema manifest export','buildSchemaManifestEnvelope');
requireText('Phase 13 schema manifest download','downloadSchemaManifest');
requireText('Phase 13 migration self-test','runCoreMigrationSelfTest');
requireText('Phase 13 portable round-trip self-test','runPortableRoundTripSelfTest');
requireText('Phase 13 readiness suite','runPhase13ReadinessSuite');
requireText('Phase 13 readiness UI','Backend readiness suite');
requireText('Phase 13 portable JSON Schema','buildPortableJsonSchema');
requireText('Phase 13 JSON Schema download','downloadPortableJsonSchema');
requireText('Phase 13 canonical snapshot','canonicalPortableSnapshotPayload');
requireText('Phase 13 stable snapshot JSON','stablePortableSnapshotJson');
requireText('Phase 13 snapshot fingerprint','computePortableSnapshotFingerprint');
requireText('Phase 13 fingerprint UI','Compute snapshot fingerprint');
requireText('Phase 15 privacy baseline','PHASE 14 — SECURITY + PRIVACY + TRUST HARDENING v26');
requireText('Phase 13 model integrity','validateNormalizedDataModel');
requireText('Phase 13 integrity summary','normalizedIntegritySummary');
requireText('Phase 13 historical category preservation','Archived category');
requireText('Phase 13 historical bill preservation','Archived bill');
requireText('Phase 13 serialization round trip','runPortableRoundTrip');
requireText('Phase 14 security privacy trust','PHASE 14 — SECURITY + PRIVACY + TRUST HARDENING v26');
requireText('Phase 14 import limits','IMPORT_SECURITY_LIMITS');
requireText('Phase 14 import sanitizer','sanitizeImportedText');
requireText('Phase 14 file size guard','assertImportFileSafe');
requireText('Phase 14 local data inventory','localDataInventory');
requireText('Phase 14 client secret audit','clientSecretAudit');
requireText('Phase 14 raw local export','downloadRawLocalDataExport');
requireText('Phase 14 delete local data','clearAllThisWeekLocalData');
requireText('Phase 14 high-impact confirmation','confirmHighImpactMutation');
requireText('Phase 14 privacy route','renderPrivacy');
requireText('Phase 14 trust self-audit','runPhase14TrustAudit');
requireText('Phase 14 referrer policy','<meta name="referrer" content="no-referrer">');
forbidText('Phase 14 runtime eval forbidden','eval(');
forbidText('Phase 14 Function constructor forbidden','new Function(');
forbidText('Phase 14 runtime network fetch forbidden','fetch(');
forbidText('Phase 14 XMLHttpRequest construction forbidden','new XMLHttpRequest(');
forbidText('Phase 14 WebSocket construction forbidden','new WebSocket(');
forbidText('Phase 14 sendBeacon forbidden','sendBeacon');
requireText('Phase 14 plan edit confirmation','Save these Plan changes?');
requireText('Phase 14 runtime dependency check','Runtime network dependency boundary');
requireText('Phase 14 CSP network boundary',"connect-src 'none'");
requireText('Phase 14 CSP object boundary',"object-src 'none'");
requireText('Phase 14 CSP frame boundary',"frame-src 'none'");
requireText('Phase 14 CSP script-attribute boundary',"script-src-attr 'none'");
requireText('Phase 14 CSP base boundary',"base-uri 'none'");
requireText('Phase 14 CSP form boundary',"form-action 'none'");
requireText('Phase 14 hashed script CSP',"'sha256-");
forbidText('Phase 14 script-src must not allow unsafe-inline',"script-src 'self' 'unsafe-inline'");
forbidText('Phase 14 inline onclick attributes forbidden','onclick="');
forbidText('Phase 14 inline onsubmit attributes forbidden','onsubmit="');
requireText('Phase 14 local storage encryption disclosure','No app-level storage encryption');
requireText('Phase 14 typed delete confirmation','localDeletePhrase');
requireText('Phase 14 inactive-view curtain','PHASE 14 — INACTIVE VIEW PRIVACY CURTAIN');
requireText('Phase 14 privacy curtain controller','bindPrivacyCurtain');
requireText('Phase 14 privacy curtain disclosure','Financial screen masks when hidden');
requireText('Phase 14 source glossary external balance','External balance');
requireText('Phase 14 no-active-live-provider label','Provider backend provisioned · no live institution connection is active.');
requireText('Phase 14 import extension allowlist',"allowedExtensions:['csv','tsv','txt']");
requireText('Phase 14 invalid date rejection','missing a valid transaction date');
requireText('Phase 14 integer-cent range guard','Number.isSafeInteger(amountCents)');
requireText('Phase 14 sensitive export acknowledgement','confirmSensitiveExport');
requireText('Phase 14 verified local deletion','afterLocal.keys.length===0&&afterSession.keys.length===0');
requireText('Phase 14 deletion result handling','Local-data deletion not verified.');
requireText('Phase 14 storage namespace inspection','inspectAppStorageNamespace');
requireText('Phase 14 verified storage accessibility','storageAccessible');
requireText('Phase 14 delete verification failure state','Local-data deletion not verified');
requireText('CSV import','normalizeImportedRows');
requireText('Transaction import endpoint','/transaction/import');
requireText('Bill contribution endpoint','/bill/contribute');
requireText('Core state key','thisweek.state.v2');
requireText('UI prefs key','thisweek.uiPrefs.v1');
requireText('Savings goals key','thisweek.savingsGoals.v1');
requireText('Connected data key','thisweek.connectedData.v1');

const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
if(scripts.length!==2)failures.push(`Expected 2 script blocks; found ${scripts.length}`);
scripts.forEach((src,i)=>{try{new Function(src);}catch(e){failures.push(`Script ${i} syntax: ${e.message}`);}});
const cspMatch=html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);
if(!cspMatch)failures.push('Missing Content-Security-Policy meta');
else{
  const csp=cspMatch[1],scriptDirective=csp.split(';').map(x=>x.trim()).find(x=>x.startsWith('script-src '))||'';
  if(scriptDirective.includes("'unsafe-inline'"))failures.push('CSP script-src allows unsafe-inline');
  scripts.forEach((src,i)=>{
    const token="'sha256-"+createHash('sha256').update(src,'utf8').digest('base64')+"'";
    if(!scriptDirective.includes(token))failures.push(`CSP hash missing for script ${i}`);
  });
}


const duplicateIds=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]).reduce((m,id)=>(m.set(id,(m.get(id)||0)+1),m),new Map());
for(const [id,count] of duplicateIds)if(count>1&&['app','shell','main'].includes(id))failures.push(`Critical duplicate id ${id} ×${count}`);

if(failures.length){
  console.error('Phase 0 static check FAILED');
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log('Phase 0 static check PASSED');
console.log(`Scripts: ${scripts.length}; HTML bytes: ${Buffer.byteLength(html)}`);
