const SUPABASE_URL='https://xjtvawmppzwzrooairyx.supabase.co';
const PUBLISHABLE_KEY='sb_publishable_OcmV-NiXzSy7mqg3TUKxnA_74l8fq87';
const SESSION_KEY='thisweek.auth.session.v1';
const $=id=>document.getElementById(id);
let state=null;

function readSession(){try{return JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null')}catch{return null}}
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
  const s=session();
  if(!s)throw new Error('shared_staff_session_required');
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
  if(!session()){
    $('sessionNotice').innerHTML='No shared Auth session. Open <a class="back" href="../../account/">Account & Security</a>, create/sign in to a real account, confirm email, and complete TOTP.';
    $('bootstrapAdmin').disabled=true;$('setRole').disabled=true;return;
  }
  try{render(await api('status'))}
  catch(e){$('sessionNotice').textContent=String(e.message||e);$('bootstrapAdmin').disabled=true;$('setRole').disabled=true}
}
$('refresh').onclick=()=>refresh();
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
