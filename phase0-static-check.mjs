#!/usr/bin/env node
/**
 * Phase 0 static regression check for This Week.
 * Usage: node phase0-static-check.mjs
 */
import fs from 'node:fs';

const html=fs.readFileSync(new URL('./index.html', import.meta.url),'utf8');
const failures=[];
const requireText=(label,text)=>{if(!html.includes(text))failures.push(label);};

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

const duplicateIds=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]).reduce((m,id)=>(m.set(id,(m.get(id)||0)+1),m),new Map());
for(const [id,count] of duplicateIds)if(count>1&&['app','shell','main'].includes(id))failures.push(`Critical duplicate id ${id} ×${count}`);

if(failures.length){
  console.error('Phase 0 static check FAILED');
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log('Phase 0 static check PASSED');
console.log(`Scripts: ${scripts.length}; HTML bytes: ${Buffer.byteLength(html)}`);
