const SUPABASE_URL='https://xjtvawmppzwzrooairyx.supabase.co';
const PUBLISHABLE_KEY='sb_publishable_OcmV-NiXzSy7mqg3TUKxnA_74l8fq87';
const SESSION_KEY='thisweek.auth.session.v1';
const $=id=>document.getElementById(id);
let session=readSession(),data=null,role='';

function readSession(){try{return JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null');}catch{return null;}}
function writeSession(next){session=next?.access_token?{access_token:next.access_token,refresh_token:next.refresh_token||session?.refresh_token||null,expires_at:next.expires_at||Math.floor(Date.now()/1000)+(next.expires_in||3600)}:null;if(session)sessionStorage.setItem(SESSION_KEY,JSON.stringify(session));else sessionStorage.removeItem(SESSION_KEY);}
async function rawApi(path,options={}){const h={'apikey':PUBLISHABLE_KEY,'Content-Type':'application/json',...(options.headers||{})};if(options.auth&&session?.access_token)h.Authorization='Bearer '+session.access_token;const r=await fetch(SUPABASE_URL+path,{...options,headers:h});const t=await r.text();let b={};try{b=t?JSON.parse(t):{};}catch{}if(!r.ok)throw new Error(b.error||b.message||('HTTP '+r.status));return b;}
async function ensureFresh(){if(!session?.refresh_token)throw new Error('Open the Ops Console and sign in first.');if((session.expires_at||0)-Math.floor(Date.now()/1000)>90)return;const b=await rawApi('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:session.refresh_token})});writeSession(b);}
async function release(action,extra={}){await ensureFresh();return rawApi('/functions/v1/thisweek-release-gateway',{method:'POST',auth:true,body:JSON.stringify({action,...extra})});}
function text(id,value,cls=''){const e=$(id);e.textContent=value??'';if(cls)e.className='result '+cls;}
function esc(v){return String(v??'');}
function option(value,label){const o=document.createElement('option');o.value=value;o.textContent=label;return o;}
function item(title,detail,pill,pillClass=''){const w=document.createElement('div');w.className='item';const r=document.createElement('div');r.className='row';const s=document.createElement('strong');s.textContent=title;const p=document.createElement('span');p.className='pill '+pillClass;p.textContent=pill;r.append(s,p);const d=document.createElement('div');d.className='muted';d.style.marginTop='5px';d.textContent=detail;w.append(r,d);return w;}
function currentRunStatus(runId){return (data?.runStatuses||[]).find(x=>x.runId===runId)?.status||null;}
function currentDrillStatus(drillId){return (data?.drillStatuses||[]).find(x=>x.drillId===drillId)?.status||null;}

function populate(){
  const req=$('receiptReq'),run=$('receiptRun'),gate=$('gateKey');req.textContent='';run.textContent='';gate.textContent='';
  for(const r of data?.requirements||[])req.append(option(r.requirement_key,(r.provider||'internal')+' · '+r.label));
  for(const r of data?.runs||[])run.append(option(r.id,String(r.release_candidate_sha).slice(0,12)+' · '+new Date(r.started_at).toLocaleString()));
  for(const g of data?.readiness?.gates||[])gate.append(option(g.gateKey,g.label));
  gate.onchange=populateEvidenceKeys;populateEvidenceKeys();
}
function populateEvidenceKeys(){
  const root=$('evidenceKey');root.textContent='';
  const g=(data?.readiness?.gates||[]).find(x=>x.gateKey===$('gateKey').value);
  for(const e of g?.evidence?.requirements||[])if(e.sourceType==='manual')root.append(option(e.evidenceKey,e.label));
  if(!root.options.length)root.append(option('','No manual evidence requirement'));
}
function render(){
  role=data?.role||'';const ready=data?.readiness||{},status=ready.releaseStatus||{},active=ready.activeCandidate||{},latest=ready.candidateReport?.latestCertification||null;
  $('liveState').textContent=status.liveMoneyReady?'READY':'LOCKED';$('liveState').className=status.liveMoneyReady?'good':'bad';
  $('blockingCount').textContent=String((ready.blockingGateKeys||[]).length);
  $('certState').textContent=latest?.passed?'PASS':latest?'INCOMPLETE':'NONE';$('certState').className=latest?.passed?'good':'warn';
  $('roleState').textContent=role||'—';
  const activeLabel=active.releaseCandidateSha?active.releaseCandidateSha.slice(0,12)+'…':'none selected';
  $('sessionNotice').textContent='Authenticated staff session · active candidate '+activeLabel+' · AAL2 required server-side · evidence references must not contain credentials, tokens, full account numbers, PAN/CVV, or signing secrets.';
  $('sessionNotice').className='notice';

  const gates=$('gates');gates.textContent='';
  for(const g of ready.gates||[]){
    const ev=g.evidence||{},detail=(ev.satisfiedCount||0)+'/'+(ev.requiredCount||0)+' evidence conditions satisfied'+(g.evidenceRef?' · gate ref '+g.evidenceRef:'');
    const row=item(g.label,detail,g.verified?'VERIFIED':'BLOCKING',g.verified?'pass':'block');
    for(const e of ev.requirements||[]){const sm=document.createElement('div');sm.className='muted';sm.style.fontSize='.76rem';sm.style.marginTop='4px';sm.textContent=(e.satisfied?'✓ ':'○ ')+e.label+' · '+e.sourceType+(e.evidenceRef?' · '+e.evidenceRef:'');row.appendChild(sm);}
    gates.appendChild(row);
  }
  if(!gates.children.length)gates.textContent='No release gates returned.';

  const certs=$('certifications');certs.textContent='';
  if(active.releaseCandidateSha){
    certs.appendChild(item('Active candidate · '+active.releaseCandidateSha.slice(0,12),String(active.sourceRef||'no source reference')+(active.selectedAt?' · selected '+new Date(active.selectedAt).toLocaleString():''),'ACTIVE','pass'));
  }
  for(const r of data?.runs||[]){const s=currentRunStatus(r.id);certs.appendChild(item('Run '+String(r.id).slice(0,8)+' · '+String(r.release_candidate_sha).slice(0,12),(s?.passedCount||0)+'/'+(s?.requiredCount||0)+' passed · '+(s?.failedCount||0)+' failed · '+new Date(r.started_at).toLocaleString(),s?.passed?'PASS':'OPEN',s?.passed?'pass':'block'));}
  if(!certs.children.length)certs.textContent='No certification run has been started.';

  const drills=$('drills');drills.textContent='';
  for(const d of data?.drills||[]){const s=currentDrillStatus(d.id);drills.appendChild(item(d.drill_type+' · '+d.scenario_key,String(d.id)+' · '+String(d.release_candidate_sha).slice(0,12)+' · '+new Date(d.started_at).toLocaleString(),s?.terminal?(s.passed?'PASS':'FAIL'):'OPEN',s?.passed?'pass':s?.terminal?'fail':'block'));}
  if(!drills.children.length)drills.textContent='No drill recorded.';

  const ledger=$('evidenceLedger');ledger.textContent='';
  const merged=[
    ...(data?.receipts||[]).slice(0,12).map(x=>({title:'Certification · '+x.requirement_key,detail:x.evidence_ref+' · '+new Date(x.created_at).toLocaleString(),pill:x.outcome,cls:x.outcome})),
    ...(data?.gateEvidence||[]).slice(0,12).map(x=>({title:'Gate · '+x.gate_key+' / '+x.evidence_key,detail:x.evidence_ref+' · '+new Date(x.created_at).toLocaleString(),pill:x.outcome,cls:x.outcome}))
  ].slice(0,20);
  for(const x of merged)ledger.appendChild(item(x.title,x.detail,x.pill.toUpperCase(),x.cls));
  if(!ledger.children.length)ledger.textContent='No evidence receipts recorded.';

  populate();
  if(active.releaseCandidateSha){
    $('certSha').value=active.releaseCandidateSha;
    $('drillSha').value=active.releaseCandidateSha;
  }
  const canCert=role==='risk_ops'||role==='admin',isAdmin=role==='admin';
  for(const id of ['selectCandidate','startCert','recordReceipt','startDrill','passDrill','failDrill'])$(id).disabled=!canCert;
  for(const id of ['recordGateEvidence','verifyGate','unverifyGate'])$(id).disabled=!isAdmin;
}
async function refresh(){data=await release('status');render();return data;}
async function mutate(id,action,extra){text(id,'Working…','warn');try{const r=await release(action,extra);text(id,'Recorded. Server state refreshed.','good');await refresh();return r;}catch(e){text(id,e.message,'bad');throw e;}}

$('selectCandidate').onclick=()=>mutate('candidateResult','select_candidate',{releaseCandidateSha:$('candidateSha').value.trim(),sourceRef:$('candidateSource').value.trim(),note:$('candidateNote').value.trim()}).catch(()=>{});
$('startCert').onclick=()=>mutate('certResult','start_certification',{releaseCandidateSha:$('certSha').value.trim(),note:$('certNote').value.trim()}).catch(()=>{});
$('recordReceipt').onclick=()=>mutate('receiptResult','record_certification_receipt',{runId:$('receiptRun').value,requirementKey:$('receiptReq').value,outcome:$('receiptOutcome').value,evidenceRef:$('receiptEvidence').value.trim(),safeSummary:$('receiptSummary').value.trim(),drillId:$('receiptDrill').value.trim()||null}).catch(()=>{});
$('startDrill').onclick=()=>mutate('drillResult','start_drill',{drillType:$('drillType').value,releaseCandidateSha:$('drillSha').value.trim(),scenarioKey:$('scenarioKey').value.trim(),note:$('drillNote').value.trim()}).then(r=>{$('finishDrillId').value=r.drillId||'';}).catch(()=>{});
$('passDrill').onclick=()=>mutate('drillResult','finish_drill',{drillId:$('finishDrillId').value.trim(),passed:true,evidenceRef:$('drillEvidence').value.trim(),safeSummary:$('drillSummary').value.trim()}).catch(()=>{});
$('failDrill').onclick=()=>mutate('drillResult','finish_drill',{drillId:$('finishDrillId').value.trim(),passed:false,evidenceRef:$('drillEvidence').value.trim(),safeSummary:$('drillSummary').value.trim()}).catch(()=>{});
$('recordGateEvidence').onclick=()=>mutate('gateEvidenceResult','record_gate_evidence',{gateKey:$('gateKey').value,evidenceKey:$('evidenceKey').value,environment:$('evidenceEnvironment').value,outcome:$('gateEvidenceOutcome').value,evidenceRef:$('gateEvidenceRef').value.trim(),safeSummary:$('gateEvidenceSummary').value.trim()}).catch(()=>{});
$('verifyGate').onclick=()=>mutate('gateResult','set_release_gate',{gateKey:$('gateKey').value,verified:true,evidenceRef:$('gateVerificationRef').value.trim(),note:$('gateVerificationNote').value.trim()}).catch(()=>{});
$('unverifyGate').onclick=()=>mutate('gateResult','set_release_gate',{gateKey:$('gateKey').value,verified:false,evidenceRef:$('gateVerificationRef').value.trim(),note:$('gateVerificationNote').value.trim()}).catch(()=>{});

async function loadDeployedRelease(){
  try{
    const r=await fetch('../../release.json?candidate='+Date.now(),{cache:'no-store'});
    if(!r.ok)return;
    const m=await r.json();
    if(/^[0-9a-f]{40}$/.test(String(m.commit||'')))$('candidateSha').value=String(m.commit);
    if(m.workflowRunId)$('candidateSource').value='github-pages:run:'+String(m.workflowRunId);
  }catch{}
}
loadDeployedRelease();
if(!session?.access_token){$('sessionNotice').innerHTML='No shared staff session in this tab. <a href="../">Open the Ops Console</a>, sign in, and verify MFA first.';for(const b of document.querySelectorAll('button'))b.disabled=true;}
else refresh().catch(e=>{if(/session|auth|mfa|staff/i.test(e.message))writeSession(null);$('sessionNotice').textContent=e.message;$('sessionNotice').className='notice';});
