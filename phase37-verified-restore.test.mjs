import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
function excerpt(start,end){
 const a=html.indexOf(start),b=html.indexOf(end,a+start.length);
 assert(a>=0&&b>a, 'Unable to locate production restore implementation: '+start);
 return html.slice(a,b);
}
const source=[
 excerpt('function inferCoreSchemaVersion(', 'function migrateCoreStateV1ToV2('),
 excerpt('function inspectAppStorageNamespace(', 'function appStorageKeys('),
 excerpt('function scanObjectForSensitiveFieldNames(', 'function clientSecretAudit('),
 excerpt('function isRawBackupSafeLocalKey(', 'function clearAllThisWeekLocalData(')
].join('\n');
const keys={
 USER_ID_KEY:'thisweek.userId',
 STATE_KEY:'thisweek.state.v2',
 UI_PREFS_KEY:'thisweek.uiPrefs.v1',
 POWER_PREFS_KEY:'thisweek.powerPrefs.v1',
 SAVINGS_GOALS_KEY:'thisweek.savingsGoals.v1',
 CONNECTED_DATA_KEY:'thisweek.connectedData.v1',
 RECOMMENDATION_PREFS_KEY:'thisweek.recommendations.v1',
 SCENARIO_DRAFT_KEY:'thisweek.scenarioDraft.v1',
 LOCAL_ANALYTICS_KEY:'thisweek.analytics.v1',
 FLEX_CAPS_KEY:'thisweek.flexCaps.v1',
 PRECHECK_HINT_KEY:'thisweek.precheckHint.v1',
 FIN_EVENT_KEY:'thisweek.finEvent.v1'
};
function boot(){
 const disk=new Map(),sessions=new Map(),warnings=[];
 const localStorage={
   get length(){return disk.size;},
   key(n){return [...disk.keys()][n]??null;},
   getItem(k){return disk.get(k)??null;},
   setItem(k,v){if(this.failKey===k)throw Error('QuotaExceededError');disk.set(k,v);},
   removeItem(k){if(this.failRemove===k)throw Error('Removal denied');disk.delete(k)}
 };
 const sessionStorage={
   get length(){return sessions.size;},
   key(n){return [...sessions.keys()][n]??null;},
   getItem(k){return sessions.get(k)??null;},
 };
 const defs=Object.entries(keys).map(([k,v])=>'const '+k+'='+JSON.stringify(v)+';').join('\n');
 const ctx=vm.createContext({localStorage,sessionStorage,console,warnings});
 vm.runInContext(defs+