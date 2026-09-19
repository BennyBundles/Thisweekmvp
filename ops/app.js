const SUPABASE_URL='https://xjtvawmppzwzrooairyx.supabase.co';
const PUBLISHABLE_KEY='sb_publishable_OcmV-NiXzSy7mqg3TUKxnA_74l8fq87';
const SESSION_KEY='thisweek.auth.session.v1';
const $=id=>document.getElementById(id);
let session=readSession(),user=null,dashboardData=null;

function readSession(){try{return JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null');}catch{return null;}}
function writeSession(next){session=next?.access_token?{access_token:next.access_token,refresh_token:next.refresh_token||session?.refresh_token||null,expires_at:next.expires_at||Math.floor(Date.now()/1000)+(next.expires_in||3600)}:null;if(session)sessionStorage.setItem(SESSION_KEY,JSON.stringify(session));else sessionStorage.removeItem(SESSION_KEY);updateUi();}
function jwtPayload(token){try{const p=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(atob(p.padEnd(Math.ceil(p.length/4)*4,'=')));}catch{return{};}}
function headers(auth=false){const h={'apikey':PUBLISHABLE_KEY,'Content-Type':'application/json'};if(auth&&session?.access_token)h.Authorization='Bearer '+session.access_token;return h;}
async function api(path,options={}){const r=await fetch(SUPABASE_URL+path,{...options,headers:{...headers(!!options.auth),...(options.headers||{})}});const text=await r.text();let b={};try{b=text?JSON.parse(text):{};}catch{b={raw:text};}if(!r.ok)throw new Error(b.msg||b.message||b.error_description||b.error||('HTTP '+r.status));return b;}
async function ensureFresh(){if(!session?.refresh_token)return false;if((session.expires_at||0)-Math.floor(Date.now()/1000)>90)return true;const b=await api('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:session.refresh_token})});writeSession(b);return true;}
async function getUser(){if(!session?.access_token){user=null;updateUi();renderFactors();return null;}await ensureFresh();user=await api('/auth/v1/user',{method:'GET',auth:true});updateUi();renderFactors();return user;}
function setResult(id,text,kind=''){const el=$(id);el.textContent=text||'';el.className='result '+kind;}
function updateUi(){const p=session?.access_token?jwtPayload(session.access_token):{};$('sessionState').textContent=session?'Signed in':'Signed out';$('aalState').textContent=p.aal||'—';$('signOut').disabled=!session;$('verifyMfa').disabled=!session;$('refresh').disabled=!session;$('applyControl').disabled=!session;$('openIncident').disabled=!session;$('runMonitor').disabled=!session;}
function renderFactors(){const el=$('factorSelect');el.textContent='';const factors=Array.isArray(user?.factors)?user.factors.filter(x=>x.status==='verified'):[];if(!factors.length){const o=document.createElement('option');o.value='';o.textContent='No verified factor';el.appendChild(o);return;}for(const f of factors){const o=document.createElement('option');o.value=f.id;o.textContent=(f.friendly_name||'TOTP')+' · '+f.status;el.appendChild(o);}}
async function signIn(){const email=$('email').value.trim(),password=$('password').value;if(!email||password.length<10)throw new Error('Enter staff email and password.');const b=await api('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});writeSession(b);$('password').value='';await getUser();setResult('authResult','Signed in. Verify MFA to open staff operations.','good');await refreshDashboard().catch(e=>setResult('authResult',e.message,'warn'));}
async function signOut(){if(session)try{await api('/auth/v1/logout?scope=local',{method:'POST',auth:true,body:'{}'});}catch{}writeSession(null);user=null;dashboardData=null;renderFactors();clearDashboard();setResult('authResult','Signed out.','good');}
async function verifyMfa(){await ensureFresh();const factorId=$('factorSelect').value,code=$('totpCode').value.trim();if(!factorId||!/^[0-9]{6,8}$/.test(code))throw new Error('Choose a verified factor and enter its current code.');const ch=await api('/auth/v1/factors/'+encodeURIComponent(factorId)+'/challenge',{method:'POST',auth:true,body:'{}'});const v=await api('/auth/v1/factors/'+encodeURIComponent(factorId)+'/verify',{method:'POST',auth:true,body:JSON.stringify({challenge_id:ch.id,code})});if(v.access_token)writeSession(v);$('totpCode').value='';await getUser();setResult('mfaResult','MFA verified.','good');await refreshDashboard();}
async function ops(action,extra={}){await ensureFresh();const r=await fetch(SUPABASE_URL+'/functions/v1/thisweek-ops-gateway',{method:'POST',headers:{'apikey':PUBLISHABLE_KEY,'Authorization':'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({action,...extra})});const text=await r.text();let b={};try{b=text?JSON.parse(text):{};}catch{b={raw:text};}if(!r.ok)throw new Error(b.error||('Ops Gateway HTTP '+r.status));return b;}
function clearDashboard(){$('roleState').textContent='—';$('alertCount').textContent='—';$('reviewCount').textContent='—';$('healthState').textContent='—';for(const id of ['alerts','reviews','cases','support','incidents','health','automation','releaseStatus','legalRetention']){$(id).textContent='';const e=document.createElement('div');e.className='empty';e.textContent='No data loaded.';$(id).appendChild(e);}$('audit').textContent='';const e=document.createElement('div');e.className='empty';e.textContent='No audit data loaded.';$('audit').appendChild(e);setResult('notificationResult','');}
function badge(text,severity='medium'){const s=document.createElement('span');s.className='badge '+severity;s.textContent=text;return s;}
function money(cents){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(cents||0)/100);}
function button(label,fn,cls=''){const b=document.createElement('button');b.textContent=label;if(cls)b.className=cls;b.addEventListener('click',()=>fn().catch(e=>setResult('authResult',e.message,'bad')));return b;}
function itemBase(kicker,title,severity='medium'){const wrap=document.createElement('div');wrap.className='item';const head=document.createElement('div');head.className='item-head';const copy=document.createElement('div');const sm=document.createElement('small');sm.textContent=kicker;const st=document.createElement('strong');st.textContent=title;copy.append(sm,st);head.append(copy,badge(severity,severity));wrap.appendChild(head);return wrap;}
function renderAlerts(rows){const root=$('alerts');root.textContent='';if(!rows.length){const e=document.createElement('div');e.className='empty';e.textContent='No open alerts.';root.appendChild(e);return;}for(const x of rows){const item=itemBase(x.alert_type||'Alert',(x.user_id||'user')+' · '+(x.state||'open'),x.severity||'medium');const p=document.createElement('p');p.textContent='Created '+new Date(x.created_at).toLocaleString()+(x.case_id?' · case '+x.case_id:'')+(x.risk_review_id?' · review '+x.risk_review_id:'');item.appendChild(p);if(x.state==='open')item.appendChild(button('Acknowledge',async()=>{await ops('ack_alert',{alertId:x.id});await refreshDashboard();},'primary'));root.appendChild(item);}}
function renderReviews(rows,role){const root=$('reviews');root.textContent='';if(!rows.length){const e=document.createElement('div');e.className='empty';e.textContent='No pending risk reviews.';root.appendChild(e);return;}for(const r of rows){const ev=r.riskEvent||{};const item=itemBase('Risk review '+r.id,(ev.action||'risk action')+' · '+money(ev.amount_cents),'high');const p=document.createElement('p');p.textContent='User '+r.user_id+' · '+(ev.reason_code||'manual review')+' · '+new Date(r.created_at).toLocaleString();item.appendChild(p);const controls=document.createElement('div');controls.className='controls';const reason=document.createElement('input');reason.placeholder='resolution reason';const note=document.createElement('input');note.placeholder='optional note';controls.append(reason,note);const action=document.createElement('div');action.className='actions';const allowed=role==='risk_ops'||role==='admin';const approve=button('Approve',async()=>{if(!reason.value.trim())throw new Error('Enter a resolution reason.');await ops('resolve_risk_review',{reviewId:r.id,resolution:'approved',reasonCode:reason.value.trim(),note:note.value.trim()});await refreshDashboard();},'primary');const deny=button('Deny',async()=>{if(!reason.value.trim())throw new Error('Enter a resolution reason.');await ops('resolve_risk_review',{reviewId:r.id,resolution:'denied',reasonCode:reason.value.trim(),note:note.value.trim()});await refreshDashboard();},'danger');approve.disabled=deny.disabled=!allowed;action.append(approve,deny);item.append(controls,action);root.appendChild(item);}}
function renderCases(rows){const root=$('cases');root.textContent='';if(!rows.length){const e=document.createElement('div');e.className='empty';e.textContent='No open operational cases.';root.appendChild(e);return;}for(const c of rows){const item=itemBase(c.case_type||'Case',(c.user_id||'user')+' · '+(c.state||'open'),c.severity||'medium');const p=document.createElement('p');p.textContent=(c.provider||'internal')+' · '+(c.reason_code||'no reason')+' · '+(c.amount_cents==null?'no amount':money(c.amount_cents))+(c.assigned_to_staff_user_id?' · assigned':' · unassigned');item.appendChild(p);const controls=document.createElement('div');controls.className='controls';const state=document.createElement('select');for(const v of ['monitoring','action_required','resolved','closed']){const o=document.createElement('option');o.value=v;o.textContent=v.replaceAll('_',' ');state.appendChild(o);}state.value=c.state==='open'?'monitoring':c.state;const reason=document.createElement('input');reason.placeholder='resolution reason';const note=document.createElement('input');note.placeholder='bounded staff note';controls.append(state,reason,note);const action=document.createElement('div');action.className='actions';action.append(button('Assign to me',async()=>{await ops('assign_case',{caseId:c.id});await refreshDashboard();}),button('Update case',async()=>{if(!reason.value.trim())throw new Error('Enter a reason.');await ops('resolve_case',{caseId:c.id,state:state.value,reasonCode:reason.value.trim(),note:note.value.trim()});await refreshDashboard();},'primary'),button('Use user ID',async()=>{$('controlUserId').value=c.user_id;}));item.append(controls,action);root.appendChild(item);}}

function renderHealth(h){
  const root=$('health');root.textContent='';
  if(!h){const e=document.createElement('div');e.className='empty';e.textContent='No health data.';root.appendChild(e);return;}
  const item=itemBase('Internal beta targets',String(h.state||'unknown').toUpperCase(),h.state==='critical'?'critical':h.state==='degraded'?'high':'medium');
  const c=h.counts||{};const p=document.createElement('p');
  p.textContent='Policy '+(h.policyVersion||'—')+' · critical overdue '+(c.criticalOverdue||0)+' · high overdue '+(c.highOverdue||0)+' · unanswered support '+(c.supportOverdue||0)+' · overdue reviews '+(c.reviewOverdue||0)+' · stale cases '+(c.staleCases||0)+' · recent provider failures '+(c.recentProviderFailures||0)+'.';
  item.appendChild(p);root.appendChild(item);$('healthState').textContent=String(h.state||'—');
}

function renderAutomation(a,role){
  const root=$('automation');root.textContent='';
  if(!a){const e=document.createElement('div');e.className='empty';e.textContent='No automated monitor data.';root.appendChild(e);return;}
  const snapshot=a.latestSnapshot||{};
  const run=a.latestRun||{};
  const state=String(snapshot.health_state||run.safe_detail?.healthState||'unknown');
  const item=itemBase('Scheduled monitor',state.toUpperCase(),state==='critical'?'critical':state==='degraded'?'high':'medium');
  const c=snapshot.counts||{};
  const age=a.heartbeatAgeMinutes==null?'unknown':Math.round(Number(a.heartbeatAgeMinutes))+'m';
  const p=document.createElement('p');
  p.textContent='Scheduler '+(a.schedulerState||'unknown')+' · heartbeat '+age+' ago · policy '+(snapshot.policy_version||'—')+
    ' · ledger mismatches '+(c.unbalancedJournals||0)+
    ' · stuck provider events '+(c.stuckProviderEvents||0)+
    ' · stale transfers '+(c.staleTransfers24h||0)+
    ' · stale bill payments '+(c.staleBillPayments24h||0)+
    ' · provider failures '+(c.providerFailures15m||0)+'.';
  item.appendChild(p);
  const channel=document.createElement('p');
  channel.textContent=a.externalChannelConfigured?'External paging configured.':'External paging is not configured; high/critical notifications remain durable in the outbox.';
  item.appendChild(channel);
  root.appendChild(item);

  const notes=a.pendingNotifications||[];
  if(!notes.length){
    const e=document.createElement('div');e.className='empty';e.textContent='No pending external notifications.';root.appendChild(e);
    return;
  }
  for(const n of notes){
    const row=itemBase('Notification outbox',n.subject||'Operational notification',n.severity||'high');
    const detail=document.createElement('p');
    detail.textContent=(n.state||'pending')+' · '+new Date(n.created_at).toLocaleString()+' · '+(n.safe_body||'');
    row.appendChild(detail);
    const controls=document.createElement('div');controls.className='controls';
    const reason=document.createElement('input');reason.placeholder='suppression reason';reason.maxLength=120;
    const spacer1=document.createElement('div'),spacer2=document.createElement('div');
    controls.append(reason,spacer1,spacer2);row.appendChild(controls);
    const allowed=role==='risk_ops'||role==='admin';
    const suppress=button('Suppress notification',async()=>{
      if(!reason.value.trim())throw new Error('Enter a suppression reason.');
      await ops('suppress_notification',{notificationId:n.id,reasonCode:reason.value.trim()});
      setResult('notificationResult','Notification suppressed with audit record.','good');
      await refreshDashboard();
    },'danger');
    suppress.disabled=!allowed;
    row.appendChild(suppress);root.appendChild(row);
  }
}
async function runMonitorNow(){
  const d=await ops('run_monitor');
  setResult('notificationResult','Monitor completed: '+(d.result?.healthState||'unknown')+'.','good');
  await refreshDashboard();
}


function renderReleaseStatus(status,role){
  const root=$('releaseStatus');root.textContent='';
  if(!status){const e=document.createElement('div');e.className='empty';e.textContent='No release-interlock data.';root.appendChild(e);return;}
  const live=status.liveMoneyReady===true;
  const summary=itemBase('Production interlock',live?'LIVE MONEY READY':'LOCKED',live?'medium':'high');
  const staff=status.staffCoverage||{};
  const p=document.createElement('p');
  p.textContent='Manual gates '+(status.manualGatesReady?'complete':'incomplete')+
    ' · production risk policy '+(status.productionRiskPolicyActive?'active':'inactive')+
    ' · incident channel '+(status.notificationChannelHealthy?'healthy':'not healthy')+
    ' · legal set '+(status.productionLegalSetActive?'active':'inactive')+
    ' · retention '+(status.productionRetentionPolicyActive?'active':'inactive')+
    ' · access audit '+(status.sensitiveAccessAuditActive?'active':'inactive')+
    ' · staff admin/risk/support '+[staff.admin,staff.risk,staff.support].map(x=>x?'yes':'no').join('/')+'.';
  summary.appendChild(p);
  const warning=document.createElement('p');
  warning.textContent=live?'All server release conditions currently pass. Environment/provider production controls still remain independently required.':'Production provider execution remains denied by the server interlock.';
  summary.appendChild(warning);root.appendChild(summary);

  for(const g of status.gates||[]){
    const row=itemBase(g.category||'release gate',(g.label||g.gateKey)+' · '+(g.verified?'VERIFIED':'BLOCKING'),g.verified?'medium':'high');
    const meta=document.createElement('p');
    meta.textContent=(g.evidenceRef?'Evidence: '+g.evidenceRef:'No evidence recorded')+
      (g.verifiedAt?' · verified '+new Date(g.verifiedAt).toLocaleString():'');
    row.appendChild(meta);
    if(g.note){const note=document.createElement('p');note.textContent=g.note;row.appendChild(note);}
    if(role==='admin'){
      const controls=document.createElement('div');controls.className='controls';
      const evidence=document.createElement('input');evidence.placeholder='evidence / approval reference';evidence.maxLength=500;evidence.value=g.evidenceRef||'';
      const note=document.createElement('input');note.placeholder='bounded release note';note.maxLength=1000;note.value=g.note||'';
      const spacer=document.createElement('div');controls.append(evidence,note,spacer);row.appendChild(controls);
      const actions=document.createElement('div');actions.className='actions';
      const update=async verified=>{
        if(evidence.value.trim().length<3)throw new Error('Enter an evidence or approval reference.');
        await ops('set_release_gate',{gateKey:g.gateKey,verified,evidenceRef:evidence.value.trim(),note:note.value.trim()});
        setResult('releaseGateResult',verified?'Release gate verified.':'Release gate revoked.','good');
        await refreshDashboard();
      };
      actions.append(button('Verify gate',()=>update(true),'primary'),button('Revoke gate',()=>update(false),'danger'));
      row.appendChild(actions);
    }
    root.appendChild(row);
  }
}


function renderLegalRetention(data,role){
  const root=$('legalRetention');root.textContent='';
  if(!data){const e=document.createElement('div');e.className='empty';e.textContent='No legal/retention data.';root.appendChild(e);return;}
  const retentionReady=data.retentionStatus?.ready===true;
  const summary=itemBase('production policy',
    'Retention '+(retentionReady?'READY':'BLOCKING')+' · sensitive access events '+String(data.recentSensitiveAccess?.length||0),
    retentionReady?'medium':'high');
  const p=document.createElement('p');
  p.textContent='Legal documents and retention policies must be active and approved before the server interlock can become ready.';
  summary.appendChild(p);root.appendChild(summary);

  for(const d of data.documents||[]){
    const ready=d.active===true&&d.approved_for_use===true;
    const row=itemBase('legal · '+(d.document_key||'document'),
      (d.title||d.document_key)+' · '+(ready?'ACTIVE / APPROVED':'BLOCKING'),
      ready?'medium':'high');
    const meta=document.createElement('p');
    meta.textContent='Version '+(d.version||'—')+' · SHA-256 '+String(d.content_sha256||'').slice(0,14)+'…'+
      (d.evidence_ref?' · evidence '+d.evidence_ref:' · no approval evidence');
    row.appendChild(meta);
    const link=document.createElement('a');link.href=d.public_path||'#';link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open document';row.appendChild(link);
    if(role==='admin'){
      const controls=document.createElement('div');controls.className='controls';
      const evidence=document.createElement('input');evidence.placeholder='legal approval / evidence reference';evidence.maxLength=500;evidence.value=d.evidence_ref||'';
      const note=document.createElement('input');note.placeholder='bounded note';note.maxLength=1000;
      const spacer=document.createElement('div');controls.append(evidence,note,spacer);row.appendChild(controls);
      const actions=document.createElement('div');actions.className='actions';
      const update=async(active,approved)=>{
        if(evidence.value.trim().length<3)throw new Error('Enter legal approval evidence.');
        await ops('set_legal_document_state',{documentId:d.id,active,approvedForUse:approved,evidenceRef:evidence.value.trim(),note:note.value.trim()});
        setResult('legalRetentionResult',active&&approved?'Legal document activated.':'Legal document revoked.','good');
        await refreshDashboard();
      };
      actions.append(button('Activate approved',()=>update(true,true),'primary'),button('Revoke',()=>update(false,false),'danger'));
      row.appendChild(actions);
    }
    root.appendChild(row);
  }

  for(const pcy of data.policies||[]){
    const ready=pcy.active===true&&pcy.approved_for_use===true;
    const row=itemBase('retention · '+(pcy.data_class||'class'),
      (pcy.policy_version||'policy')+' · '+(ready?'ACTIVE / APPROVED':'BLOCKING'),
      ready?'medium':'high');
    const meta=document.createElement('p');
    meta.textContent='Disposition '+(pcy.disposition||'—')+
      ' · retention '+(pcy.retention_days==null?'policy/legal review':pcy.retention_days+' days')+
      (pcy.evidence_ref?' · evidence '+pcy.evidence_ref:' · no approval evidence');
    row.appendChild(meta);
    if(role==='admin'){
      const controls=document.createElement('div');controls.className='controls';
      const evidence=document.createElement('input');evidence.placeholder='retention approval / evidence reference';evidence.maxLength=500;evidence.value=pcy.evidence_ref||'';
      const note=document.createElement('input');note.placeholder='bounded note';note.maxLength=1000;note.value=pcy.note||'';
      const spacer=document.createElement('div');controls.append(evidence,note,spacer);row.appendChild(controls);
      const actions=document.createElement('div');actions.className='actions';
      const update=async(active,approved)=>{
        if(evidence.value.trim().length<3)throw new Error('Enter retention approval evidence.');
        await ops('set_retention_policy_state',{policyId:pcy.id,active,approvedForUse:approved,evidenceRef:evidence.value.trim(),note:note.value.trim()});
        setResult('legalRetentionResult',active&&approved?'Retention policy activated.':'Retention policy revoked.','good');
        await refreshDashboard();
      };
      actions.append(button('Activate approved',()=>update(true,true),'primary'),button('Revoke',()=>update(false,false),'danger'));
      row.appendChild(actions);
    }
    root.appendChild(row);
  }

  const access=(data.recentSensitiveAccess||[]).slice(0,12);
  if(access.length){
    const block=itemBase('sensitive access','Recent staff reads · '+access.length,'medium');
    for(const x of access){
      const line=document.createElement('p');
      line.textContent=(x.action||'access')+' · '+(x.staff_role||'role')+' · '+new Date(x.created_at).toLocaleString();
      block.appendChild(line);
    }
    root.appendChild(block);
  }
}

function renderSupport(rows,messages){
  const root=$('support');root.textContent='';
  if(!rows.length){const e=document.createElement('div');e.className='empty';e.textContent='No open support requests.';root.appendChild(e);return;}
  for(const r of rows){
    const item=itemBase((r.request_type||'support').replaceAll('_',' '),(r.subject||'Support request')+' · '+(r.state||'open'),r.priority==='high'?'high':'medium');
    const p=document.createElement('p');p.textContent='User '+r.user_id+' · '+new Date(r.created_at).toLocaleString()+(r.resource_kind?' · '+r.resource_kind+' '+r.resource_ref:'')+(r.assigned_to_staff_user_id?' · assigned':' · unassigned');item.appendChild(p);
    const thread=(messages||[]).filter(x=>x.request_id===r.id);
    for(const m of thread.slice(-8)){const line=document.createElement('p');line.textContent=(m.author_kind==='staff'?'Staff':'User')+': '+(m.body||'');item.appendChild(line);}
    const controls=document.createElement('div');controls.className='controls';
    const next=document.createElement('select');for(const v of ['triaged','waiting_on_user','resolved','closed']){const o=document.createElement('option');o.value=v;o.textContent=v.replaceAll('_',' ');next.appendChild(o);}next.value=r.state==='open'?'triaged':r.state;
    const reply=document.createElement('input');reply.placeholder='customer-visible reply';reply.maxLength=4000;
    const spacer=document.createElement('div');controls.append(next,reply,spacer);
    const actions=document.createElement('div');actions.className='actions';
    actions.append(
      button('Assign to me',async()=>{await ops('support_assign',{requestId:r.id});await refreshDashboard();}),
      button('Send reply',async()=>{const message=reply.value.trim();if(!message)throw new Error('Enter a support reply.');await ops('support_reply',{requestId:r.id,message,nextState:next.value});await refreshDashboard();},'primary'),
      button('Use user ID',async()=>{$('controlUserId').value=r.user_id;})
    );
    item.append(controls,actions);root.appendChild(item);
  }
}
function renderIncidents(rows){
  const root=$('incidents');root.textContent='';
  if(!rows.length){const e=document.createElement('div');e.className='empty';e.textContent='No active incidents.';root.appendChild(e);return;}
  for(const x of rows){
    const item=itemBase(x.component||'incident',(x.title||'Incident')+' · '+x.state,x.severity==='critical'?'critical':x.severity==='major'?'high':'medium');
    const p=document.createElement('p');p.textContent=(x.safe_summary||'')+' · started '+new Date(x.started_at).toLocaleString();item.appendChild(p);
    const controls=document.createElement('div');controls.className='controls';
    const state=document.createElement('select');for(const v of ['investigating','identified','monitoring','resolved']){const o=document.createElement('option');o.value=v;o.textContent=v;state.appendChild(o);}state.value=x.state;
    const summary=document.createElement('input');summary.value=x.safe_summary||'';summary.maxLength=2000;
    const spacer=document.createElement('div');controls.append(state,summary,spacer);
    item.append(controls,button('Update incident',async()=>{if(!summary.value.trim())throw new Error('Enter an incident summary.');await ops('update_incident',{incidentId:x.id,state:state.value,summary:summary.value.trim()});await refreshDashboard();},'primary'));root.appendChild(item);
  }
}
async function openIncident(){
  const title=$('incidentTitle').value.trim(),summary=$('incidentSummary').value.trim();
  if(title.length<3||!summary)throw new Error('Enter incident title and summary.');
  const d=await ops('open_incident',{clientRequestId:'incident_'+crypto.randomUUID(),title,component:$('incidentComponent').value,severity:$('incidentSeverity').value,summary});
  $('incidentTitle').value='';$('incidentSummary').value='';setResult('incidentResult','Incident opened: '+d.incidentId,'good');await refreshDashboard();
}
function renderAudit(rows){const root=$('audit');root.textContent='';if(!rows.length){const e=document.createElement('div');e.className='empty';e.textContent='No staff actions recorded.';root.appendChild(e);return;}for(const x of rows){const r=document.createElement('div');r.className='audit-row';const strong=document.createElement('strong');strong.textContent=(x.action||'action')+' · '+(x.staff_role||'role');const text=document.createTextNode(' — '+(x.target_type||'target')+' '+(x.target_ref||'')+' · '+new Date(x.created_at).toLocaleString()+(x.reason_code?' · '+x.reason_code:''));r.append(strong,text);root.appendChild(r);}}
async function refreshDashboard(){const d=await ops('dashboard');dashboardData=d;const role=d.staff?.role||'';$('roleState').textContent=role||'—';$('alertCount').textContent=String(d.alerts?.length||0);$('reviewCount').textContent=String(d.riskReviews?.length||0);$('runMonitor').disabled=!(role==='risk_ops'||role==='admin');renderHealth(d.health);renderAutomation(d.automatedMonitor,role);renderReleaseStatus(d.releaseStatus,role);renderLegalRetention(d.legalRetention,role);renderAlerts(d.alerts||[]);renderSupport(d.supportRequests||[],d.supportMessages||[]);renderReviews(d.riskReviews||[],role);renderCases(d.cases||[]);renderIncidents(d.incidents||[]);renderAudit(d.recentStaffActions||[]);setResult('authResult','Operations data refreshed.','good');return d;}
async function applyControl(){const userId=$('controlUserId').value.trim(),state=$('controlState').value,reason=$('controlReason').value.trim();if(!userId)throw new Error('Enter a user ID.');if(state!=='normal'&&!reason)throw new Error('Enter a control reason.');const d=await ops('set_user_control',{userId,state,reasonCode:reason||'control_cleared'});setResult('controlResult','Control updated: '+(d.result?.state||state)+'.','good');await refreshDashboard();}
function bind(id,fn){$(id).addEventListener('click',()=>fn().catch(e=>setResult(id==='verifyMfa'?'mfaResult':id==='applyControl'?'controlResult':'authResult',e.message,'bad')));}
bind('signIn',signIn);bind('signOut',signOut);bind('verifyMfa',verifyMfa);bind('refresh',refreshDashboard);bind('runMonitor',runMonitorNow);bind('applyControl',applyControl);bind('openIncident',openIncident);
updateUi();clearDashboard();if(session?.access_token)getUser().then(()=>refreshDashboard()).catch(e=>setResult('authResult',e.message,'warn'));
