const SUPABASE_URL='https://xjtvawmppzwzrooairyx.supabase.co';
const PUBLISHABLE_KEY='sb_publishable_OcmV-NiXzSy7mqg3TUKxnA_74l8fq87';
const SESSION_KEY='thisweek.auth.session.v1';
const $=id=>document.getElementById(id);
let session=readSession(),user=null,supportData=null;

function readSession(){try{return JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null');}catch{return null;}}
function writeSession(next){session=next?.access_token?{access_token:next.access_token,refresh_token:next.refresh_token||session?.refresh_token||null,expires_at:next.expires_at||Math.floor(Date.now()/1000)+(next.expires_in||3600)}:null;if(session)sessionStorage.setItem(SESSION_KEY,JSON.stringify(session));else sessionStorage.removeItem(SESSION_KEY);updateUi();}
function headers(auth=false){const h={apikey:PUBLISHABLE_KEY,'Content-Type':'application/json'};if(auth&&session?.access_token)h.Authorization='Bearer '+session.access_token;return h;}
async function api(path,options={}){const r=await fetch(SUPABASE_URL+path,{...options,headers:{...headers(!!options.auth),...(options.headers||{})}});const text=await r.text();let b={};try{b=text?JSON.parse(text):{};}catch{b={};}if(!r.ok)throw new Error(b.msg||b.message||b.error_description||b.error||('HTTP '+r.status));return b;}
async function ensureFresh(){if(!session?.refresh_token)return false;if((session.expires_at||0)-Math.floor(Date.now()/1000)>90)return true;const b=await api('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:session.refresh_token})});writeSession(b);return true;}
async function getUser(){if(!session?.access_token){user=null;updateUi();return null;}await ensureFresh();user=await api('/auth/v1/user',{method:'GET',auth:true});updateUi();return user;}
function setResult(id,text,kind=''){const el=$(id);el.textContent=text||'';el.className='result '+kind;}
function updateUi(){const signed=!!session?.access_token;$('sessionState').textContent=signed?'Signed in':'Signed out';$('userState').textContent=user?.email||'—';$('refresh').disabled=!signed;$('createRequest').disabled=!signed;$('identityNotice').textContent=signed?'Signed in. Support requests are scoped to this cloud account.':'Use Account & Security to sign in, recover access, or verify MFA.';}
async function support(action,extra={}){await ensureFresh();const r=await fetch(SUPABASE_URL+'/functions/v1/thisweek-support-gateway',{method:'POST',headers:{apikey:PUBLISHABLE_KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({action,...extra})});const text=await r.text();let b={};try{b=text?JSON.parse(text):{};}catch{b={};}if(!r.ok)throw new Error(b.error||('Support Gateway HTTP '+r.status));return b;}
function money(cents){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(cents||0)/100);}
function sensitive(value){return /\b(?:sk_live_|sk_test_|access[-_ ]?token|refresh[-_ ]?token|api[-_ ]?secret|password\s*[:=]|cvv\s*[:=]|cvc\s*[:=])\b/i.test(value)||/\b\d{12,19}\b/.test(value)||/\b\d{3}-\d{2}-\d{4}\b/.test(value);}
function requestId(){return 'support_'+crypto.randomUUID();}
function fillResources(data){
  const el=$('resource');el.textContent='';const empty=document.createElement('option');empty.value='';empty.textContent='None / not available';el.appendChild(empty);
  const add=(kind,id,label,provider='')=>{const o=document.createElement('option');o.value=[kind,id,provider||''].join('|');o.textContent=label;el.appendChild(o);};
  for(const x of data?.transfers||[])add('transfer',x.id,'Transfer · '+money(x.amount_cents)+' · '+x.state,x.provider);
  for(const x of data?.billPayments||[])add('bill_payment',x.id,'Bill payment · '+money(x.amount_cents)+' · '+x.state,x.provider);
  for(const x of data?.cardAuthorizations||[])add('card_authorization',x.id,'Card · '+(x.merchant_name||'merchant')+' · '+money(x.amount_cents)+' · '+x.state,x.provider);
  for(const x of data?.directDepositSwitches||[])add('direct_deposit_switch',x.id,'Direct deposit · '+x.state,x.provider);
}
function messageNode(m){
  const div=document.createElement('div');div.className='message';
  const sm=document.createElement('small');sm.textContent=(m.author_kind==='staff'?'Support':'You')+' · '+new Date(m.created_at).toLocaleString();
  const p=document.createElement('p');p.textContent=m.body||'';div.append(sm,p);return div;
}
function renderRequests(data){
  const root=$('requests');root.textContent='';const rows=data?.requests||[],msgs=data?.messages||[];
  const open=rows.filter(x=>!['resolved','closed'].includes(x.state)).length;$('openCount').textContent=String(open);
  if(!rows.length){const e=document.createElement('div');e.className='empty';e.textContent='No support requests yet.';root.appendChild(e);return;}
  for(const r of rows){
    const box=document.createElement('div');box.className='request';
    const head=document.createElement('div');head.className='request-head';
    const copy=document.createElement('div'),small=document.createElement('small'),strong=document.createElement('strong');
    small.textContent=(r.request_type||'support').replaceAll('_',' ')+' · '+new Date(r.created_at).toLocaleString();
    strong.textContent=r.subject||'Support request';copy.append(small,strong);
    const badge=document.createElement('span');badge.className='badge '+(r.priority==='high'?'high':'');badge.textContent=r.state+(r.priority==='high'?' · high':'');
    head.append(copy,badge);box.appendChild(head);
    const thread=document.createElement('div');thread.className='messages';
    for(const m of msgs.filter(x=>x.request_id===r.id))thread.appendChild(messageNode(m));
    box.appendChild(thread);
    if(!['resolved','closed'].includes(r.state)){
      const field=document.createElement('div');field.className='field';
      const label=document.createElement('label');label.textContent='Add a message';
      const ta=document.createElement('textarea');ta.maxLength=4000;ta.placeholder='Add context without passwords, codes, or full account/card numbers.';
      const actions=document.createElement('div');actions.className='actions';
      const btn=document.createElement('button');btn.textContent='Send message';btn.className='primary';
      btn.onclick=async()=>{try{const msg=ta.value.trim();if(!msg)throw new Error('Enter a message.');if(sensitive(msg))throw new Error('Remove passwords, tokens, SSNs, or full account/card numbers.');await support('add_message',{requestId:r.id,message:msg});ta.value='';await refreshSupport();}catch(e){setResult('statusResult',e.message,'bad');}};
      actions.appendChild(btn);field.append(label,ta,actions);box.appendChild(field);
    }
    root.appendChild(box);
  }
}
async function refreshSupport(){const b=await support('status');supportData=b;fillResources(b.resources);renderRequests(b);setResult('statusResult','Support data refreshed.','good');return b;}
async function createRequest(){
  const requestType=$('requestType').value,subject=$('subject').value.trim(),message=$('message').value.trim();
  if(subject.length<3||!message)throw new Error('Enter a subject and message.');
  if(sensitive(subject+' '+message))throw new Error('Remove passwords, tokens, SSNs, or full account/card numbers.');
  const raw=$('resource').value;let resourceKind=null,resourceRef=null,provider=null;
  if(raw){[resourceKind,resourceRef,provider]=raw.split('|');}
  await support('create_request',{
    clientRequestId:requestId(),requestType,subject,message,
    resourceKind,resourceRef,provider:provider||null,
    priority:$('priority').checked?'high':'normal'
  });
  $('subject').value='';$('message').value='';$('priority').checked=false;
  setResult('createResult','Support request created. A request can trigger staff review, but never automatically changes money.','good');
  await refreshSupport();
}
function bind(id,fn,result='statusResult'){$(id).addEventListener('click',()=>fn().catch(e=>setResult(result,e.message,'bad')));}
bind('refresh',refreshSupport);bind('createRequest',createRequest,'createResult');
updateUi();if(session?.access_token)getUser().then(()=>refreshSupport()).catch(e=>{writeSession(null);setResult('statusResult','Session expired. Sign in through Account & Security.','warn');});
