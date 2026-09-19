const SUPABASE_URL='https://xjtvawmppzwzrooairyx.supabase.co';
const PUBLISHABLE_KEY='sb_publishable_OcmV-NiXzSy7mqg3TUKxnA_74l8fq87';
const SESSION_KEY='thisweek.auth.session.v1';
const $=id=>document.getElementById(id);
let state=null;

function readSession(){try{return JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null')}catch{return null}}
function writeSession(next){
  const current=readSession()||{};
  if(!next?.access_token){sessionStorage.removeItem(SESSION_KEY);return null;}
  const stored={
    access_token:next.access_token,
    refresh_token:next.refresh_token||current.refresh_token||null,
    expires_at:next.expires_at||Math.floor(Date.now()/1000)+Number(next.expires_in||3600),
    token_type:next.token_type||current.token_type||'bearer'
  };
  sessionStorage.setItem(SESSION_KEY,JSON.stringify(stored));
  return stored;
}
function tokenPayload(token){
  try{
    const p=String(token||'').split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
    return JSON.parse(atob(p.padEnd(Math.ceil(p.length/4)*4,'=')));
  }catch{return{};}
}
async function refreshAuthTokenIfNeeded(){
  const s=session();
  if(!s)return null;
  const p=tokenPayload(s.access_token);
  if(p.aal==='aal2')return s;
  if(!s.refresh_token)throw new Error('aal2_token_refresh_required');
  const r=await fetch(SUPABASE_URL+'/auth/v1/token?grant_type=refresh_token',{
    method:'POST',
    headers:{'Content-Type':'application/json','apikey':PUBLISHABLE_KEY},
    body:JSON.stringify({refresh_token:s.refresh_token}),
    cache:'no-store'
  });
  const data=await r.json().catch(()=>({}));
  if(!r.ok||!data.access_token)throw new Error(data.error_description||data.msg||data.error||'auth_token_refresh_failed');
  return writeSession(data);
}
function cls(id,type,msg){const el=$(id);el.className='result'+(type?' '+type:'');el.textContent=msg||''}
async function releasePrefill(){
  try{
    const r=await fetch('../../release.json?staff-bootstrap='+Date.now(),{cache:'no-store'});
    if(!r.ok)return;
    const m=await r.json();
    if(m.workflowRunId)$('bootstrapEvidence').value='github-pages:run:'+String(m.workflowRunId);
  }catch{}
}
function session(){
  const s=readSession();
  return s&&s.access_token?s:null;
}
async function api(action,payload={}){
  let s=session();
  if(!s)throw new Error('shared_staff_session_required');
  s=await refreshAuthTokenIfNeeded()||s;
  const r=await fetch(SUPABASE_URL+'/functions/v1/thisweek-staff-gateway',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+s.access_token,'apikey':PUBLISHABLE_KEY},
    body:JSON.stringify({action,...payload}),
    cache:'no-store'
  });
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data.error||'staff_gateway_failed');
  return data;
}
function render(data){
  state=data;
  const s=data.summary||{},c=data.caller||{},b=data.bootstrap||{};
  $('authUsers').textContent=String(s.authUserCount??'—');
  $('admins').textContent=String(s.adminCount??'—');
  $('coverage').textContent=String(s.riskOpsCount??0)+' / '+String(s.supportOpsCount??0);
  $('role').textContent=c.role||'none';
  $('aal').textContent=c.aal||'—';
  $('bootstrapState').textContent=b.eligible?'ELIGIBLE':b.configured?'BLOCKED':'UNCONFIGURED';
  $('bootstrapAdmin').disabled=!b.eligible;
  $('setRole').disabled=c.role!=='admin'||c.aal!=='aal2';
  const messages=[];
  if(!b.configured)messages.push('Server bootstrap email allowlist is not configured.');
  if((s.authUserCount??0)===0)messages.push('No Supabase Auth users exist yet. Create a real account first.');
  if(c.emailConfirmed===false)messages.push('Current account email is not confirmed.');
  if(c.aal!=='aal2')messages.push('Current session has not reached AAL2.');
  if(b.configured&&!b.emailMatches)messages.push('Current account is not the server-allowlisted bootstrap identity.');
  $('sessionNotice').textContent='Authenticated session detected. '+(messages.join(' ')||'Staff bootstrap checks are satisfied for the current state.');
}
async function refresh(){
  const button=$('refresh');
  if(!session()){
    $('sessionNotice').innerHTML='No shared Auth session. Open <a class="back" href="../../account/">Account & Security</a>, create/sign in to a real account, confirm email, and complete TOTP.';
    $('bootstrapAdmin').disabled=true;$('setRole').disabled=true;return;
  }
  button.disabled=true;
  $('sessionNotice').textContent='Refreshing the current Auth session and security status…';
  try{render(await api('status'))}
  catch(e){
    const message=String(e.message||e);
    $('sessionNotice').textContent=message==='aal2_token_refresh_required'
      ?'This tab has an old AAL1 token without a refresh token. Return to Account & Security in this same tab, verify the authenticator, then come back.'
      :message;
    $('bootstrapAdmin').disabled=true;$('setRole').disabled=true;
  }finally{button.disabled=false}
}
$('refresh').onclick=()=>refresh();
window.addEventListener('pageshow',()=>refresh());
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh();});
$('bootstrapAdmin').onclick=async()=>{
  cls('bootstrapResult','','Working…');
  try{
    const data=await api('bootstrap_admin',{evidenceRef:$('bootstrapEvidence').value.trim()});
    cls('bootstrapResult','good','Initial admin assigned. Refresh/re-authenticate before using staff consoles.');
    await refresh();
  }catch(e){cls('bootstrapResult','bad',String(e.message||e))}
};
$('setRole').onclick=async()=>{
  cls('roleResult','','Working…');
  try{
    const data=await api('set_role',{
      targetUserId:$('targetUserId').value.trim(),
      role:$('targetRole').value,
      reasonCode:$('reasonCode').value.trim(),
      evidenceRef:$('roleEvidence').value.trim()
    });
    cls('roleResult','good','Role change recorded: '+String(data.previousRole||'none')+' → '+String(data.nextRole||'none')+'. Target should refresh/re-authenticate.');
    await refresh();
  }catch(e){cls('roleResult','bad',String(e.message||e))}
};
releasePrefill();
refresh();
