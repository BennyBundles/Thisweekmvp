const SUPABASE_URL='https://xjtvawmppzwzrooairyx.supabase.co';
const PUBLISHABLE_KEY='sb_publishable_OcmV-NiXzSy7mqg3TUKxnA_74l8fq87';
const SESSION_KEY='thisweek.moneyLab.session.v1';
const CHAIN_KEY='thisweek.moneyLab.chain.v1';
const $=id=>document.getElementById(id);
const logEl=$('log');

let session=readSession();
let currentUser=null;
let lastEnroll=null;
let chain=readChain();
let providerAccounts=[];
let moneySummary=null;
let pinwheelToken=null;

function log(label,data){
  const stamp=new Date().toISOString().slice(11,19);
  let body='';
  try{body=typeof data==='string'?data:JSON.stringify(redact(data),null,2);}catch{body=String(data);}
  logEl.textContent='['+stamp+'] '+label+(body?'\n'+body:'')+'\n\n'+logEl.textContent.slice(0,12000);
}
function redact(value){
  if(Array.isArray(value))return value.map(redact);
  if(!value||typeof value!=='object')return value;
  const out={};
  for(const [k,v] of Object.entries(value)){
    if(/token|password|secret|qr_code|uri|account_number|routing_number|card_number|cvc|cvv/i.test(k))out[k]='[redacted]';
    else out[k]=redact(v);
  }
  return out;
}
function readSession(){
  try{return JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null');}catch{return null;}
}
function readChain(){
  try{return JSON.parse(sessionStorage.getItem(CHAIN_KEY)||'{}')||{};}catch{return {};}
}
function writeChain(next){
  chain={...chain,...next};
  sessionStorage.setItem(CHAIN_KEY,JSON.stringify(chain));
}

function writeSession(next){
  session=next&&next.access_token?{
    access_token:next.access_token,
    refresh_token:next.refresh_token||session?.refresh_token||null,
    expires_at:next.expires_at||Math.floor(Date.now()/1000)+(next.expires_in||3600),
    token_type:next.token_type||'bearer'
  }:null;
  if(session)sessionStorage.setItem(SESSION_KEY,JSON.stringify(session));
  else sessionStorage.removeItem(SESSION_KEY);
  updateUi();
}
function jwtPayload(token){
  try{
    const part=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
    return JSON.parse(decodeURIComponent(Array.from(atob(part.padEnd(Math.ceil(part.length/4)*4,'='))).map(c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join('')));
  }catch{return {};}
}
function headers(auth=false){
  const h={'apikey':PUBLISHABLE_KEY,'Content-Type':'application/json'};
  if(auth&&session?.access_token)h.Authorization='Bearer '+session.access_token;
  return h;
}
async function api(path,options={}){
  const res=await fetch(SUPABASE_URL+path,{...options,headers:{...headers(!!options.auth),...(options.headers||{})}});
  const text=await res.text();
  let body={};try{body=text?JSON.parse(text):{};}catch{body={raw:text};}
  if(!res.ok)throw new Error(body.msg||body.message||body.error_description||body.error||('HTTP '+res.status));
  return body;
}
async function ensureFresh(){
  if(!session?.refresh_token)return false;
  if((session.expires_at||0)-Math.floor(Date.now()/1000)>90)return true;
  const body=await api('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:session.refresh_token})});
  writeSession(body);
  return true;
}
async function getUser(){
  if(!session?.access_token){currentUser=null;updateUi();return null;}
  await ensureFresh();
  const user=await api('/auth/v1/user',{method:'GET',auth:true});
  currentUser=user;
  renderFactors();
  updateUi();
  return user;
}
function renderFactors(){
  const select=$('factorSelect');select.textContent='';
  const factors=Array.isArray(currentUser?.factors)?currentUser.factors:[];
  if(lastEnroll?.id&&!factors.some(x=>x.id===lastEnroll.id)){
    factors.push({id:lastEnroll.id,factor_type:'totp',status:'unverified',friendly_name:'This Week Sandbox'});
  }
  if(!factors.length){
    const o=document.createElement('option');o.value='';o.textContent='No MFA factors';select.appendChild(o);
  }else{
    for(const f of factors){
      const o=document.createElement('option');o.value=f.id;o.textContent=(f.friendly_name||f.factor_type||'factor')+' · '+(f.status||'unknown');select.appendChild(o);
    }
  }
}
function updateUi(){
  const p=session?.access_token?jwtPayload(session.access_token):{};
  $('sessionState').textContent=session?.access_token?'Signed in':'Signed out';
  $('aalState').textContent=p.aal||'—';
  $('userState').textContent=currentUser?.email||p.sub?.slice(0,8)||'—';
  const signed=!!session?.access_token;
  for(const id of ['signOut','enrollMfa','verifyMfa','gatewayStatus','gatewayBootstrap','gatewaySummary','sandboxCredit','allocate','chainRefresh','unitApplication','unitApplicationStatus','unitDeposit','unitDirectFund','plaidConsent','plaidStart','plaidFinalize','plaidAccounts','plaidUnitLink','externalFund','createCard','simulateAuth','directDepositToken','methodSetup','methodPay','registerWebhooks'])$(id).disabled=!signed;
}
async function signIn(){
  const email=$('email').value.trim(),password=$('password').value;
  if(!email||password.length<10)throw new Error('Enter an email and a password of at least 10 characters.');
  const body=await api('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});
  writeSession(body);$('password').value='';await getUser();log('Signed in',{user:currentUser?.email,aal:jwtPayload(session.access_token).aal});
}
async function signUp(){
  const email=$('email').value.trim(),password=$('password').value;
  if(!email||password.length<10)throw new Error('Enter an email and a password of at least 10 characters.');
  const body=await api('/auth/v1/signup',{method:'POST',body:JSON.stringify({email,password})});
  $('password').value='';
  if(body.access_token){writeSession(body);await getUser();log('Account created and signed in',{user:currentUser?.email});}
  else log('Account created',{message:'Check the email inbox for confirmation before signing in.',user:body.user?.email||email});
}
async function signOut(){
  if(session?.access_token){
    try{await api('/auth/v1/logout?scope=local',{method:'POST',auth:true,body:'{}'});}catch(e){log('Sign-out request warning',e.message);}
  }
  writeSession(null);currentUser=null;lastEnroll=null;renderFactors();$('qr').style.display='none';$('secret').style.display='none';log('Signed out','Session tokens cleared from this tab.');
}
async function enrollMfa(){
  await ensureFresh();
  const body=await api('/auth/v1/factors',{method:'POST',auth:true,body:JSON.stringify({factor_type:'totp',friendly_name:'This Week Money Lab'})});
  lastEnroll=body;
  const rawQr=body.totp?.qr_code||'';
  if(rawQr){
    const src=rawQr.startsWith('data:')?rawQr:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(rawQr);
    $('qr').src=src;$('qr').style.display='block';
  }
  $('secret').textContent=body.totp?.secret?'Manual setup secret: '+body.totp.secret:'';
  $('secret').style.display=body.totp?.secret?'block':'none';
  await getUser();$('factorSelect').value=body.id||'';
  log('TOTP factor enrolled',{factor_id:body.id,status:'unverified'});
}
async function verifyMfa(){
  await ensureFresh();
  const factorId=$('factorSelect').value||lastEnroll?.id;
  const code=$('totpCode').value.trim();
  if(!factorId||!/^[0-9]{6,8}$/.test(code))throw new Error('Choose a factor and enter the current authenticator code.');
  const challenge=await api('/auth/v1/factors/'+encodeURIComponent(factorId)+'/challenge',{method:'POST',auth:true,body:'{}'});
  const verified=await api('/auth/v1/factors/'+encodeURIComponent(factorId)+'/verify',{method:'POST',auth:true,body:JSON.stringify({challenge_id:challenge.id,code})});
  if(verified.access_token)writeSession(verified);
  $('totpCode').value='';await getUser();
  log('MFA verified',{factor_id:factorId,aal:jwtPayload(session.access_token).aal});
}
async function gateway(action,extra={}){
  await ensureFresh();
  const res=await fetch(SUPABASE_URL+'/functions/v1/thisweek-money-gateway',{
    method:'POST',
    headers:{'apikey':PUBLISHABLE_KEY,'Authorization':'Bearer '+session.access_token,'Content-Type':'application/json'},
    body:JSON.stringify({action,...extra})
  });
  const text=await res.text();let body={};try{body=JSON.parse(text);}catch{body={raw:text};}
  if(!res.ok)throw new Error(body.error||('Gateway HTTP '+res.status));
  return body;
}
async function providerGateway(action,extra={}){
  await ensureFresh();
  const res=await fetch(SUPABASE_URL+'/functions/v1/thisweek-provider-gateway',{
    method:'POST',
    headers:{'apikey':PUBLISHABLE_KEY,'Authorization':'Bearer '+session.access_token,'Content-Type':'application/json'},
    body:JSON.stringify({action,...extra})
  });
  const text=await res.text();let body={};try{body=JSON.parse(text);}catch{body={raw:text};}
  if(!res.ok)throw new Error(body.error||('Provider Gateway HTTP '+res.status));
  return body;
}
async function sha256Text(text){
  const bytes=new TextEncoder().encode(text);
  const hash=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));
  return Array.from(hash).map(x=>x.toString(16).padStart(2,'0')).join('');
}
function fillSelect(id,items,valueFn,labelFn,placeholder){
  const el=$(id),current=el.value;el.textContent='';
  const p=document.createElement('option');p.value='';p.textContent=placeholder;el.appendChild(p);
  for(const item of items||[]){
    const o=document.createElement('option');o.value=valueFn(item);o.textContent=labelFn(item);el.appendChild(o);
  }
  if([...el.options].some(o=>o.value===current))el.value=current;
}
async function refreshChain(){
  const [money,provider]=await Promise.all([gateway('summary'),providerGateway('status')]);
  moneySummary=money;
  $('moneyMode').textContent=(await gateway('status')).executionMode||'unknown';
  fillSelect('unitDepositSelect',money.depositAccounts?.filter(x=>x.provider==='unit'&&x.status==='open'),x=>x.id,x=>'Unit •••• '+(x.account_last4||'----'),'No open Unit account');
  fillSelect('cardEnvelopeSelect',money.envelopes,x=>x.id,x=>x.label,'No envelopes');
  fillSelect('methodEnvelopeSelect',money.envelopes,x=>x.id,x=>x.label,'No envelopes');
  fillSelect('cardSelect',money.cards?.filter(x=>x.provider==='unit'&&x.status==='active'),x=>x.id,x=>x.label+' •••• '+(x.last4||'----'),'No active Unit card');
  fillSelect('methodSourceSelect',money.fundingAccounts?.filter(x=>x.processor_provider==='method'&&x.status==='verified'),x=>x.id,x=>'Method ACH •••• '+(x.account_last4||'----'),'No verified Method source');
  fillSelect('methodBillerSelect',money.bills?.filter(x=>x.discovery_provider==='method'&&x.status==='active'),x=>x.id,x=>x.display_name+(x.account_mask?' •••• '+x.account_mask:''),'No Method liabilities');
  fillSelect('plaidAccountSelect',providerAccounts,x=>x.id,x=>(x.displayName||x.name||'Plaid account')+(x.mask?' •••• '+x.mask:''),'Load Plaid accounts');
  log('Sandbox chain refreshed',{money,provider});
  return {money,provider};
}
function cents(input){
  const n=Number(input);if(!Number.isFinite(n)||n<=0)throw new Error('Amount must be positive.');
  return Math.round(n*100);
}
function requestId(prefix){return prefix+'_'+crypto.randomUUID();}

async function unitApplication(){
  const body=await gateway('unit_sandbox_application');
  log('Unit Sandbox applicant',body);
  await refreshChain();
}
async function unitApplicationStatus(){
  const body=await gateway('unit_application_status');
  log('Unit application status',body);
  await refreshChain();
}
async function unitDeposit(){
  const body=await gateway('unit_create_deposit_account',{clientRequestId:requestId('unit_deposit')});
  log('Unit deposit account',body);
  await refreshChain();
}
async function unitDirectFund(){
  const depositAccountId=$('unitDepositSelect').value;
  if(!depositAccountId)throw new Error('Select an open Unit deposit account.');
  const body=await gateway('unit_sandbox_fund',{depositAccountId,amountCents:cents($('unitDirectFundAmount').value)});
  log('Unit Sandbox ACH credit submitted',body);
  await refreshChain();
}
async function plaidConsent(){
  log('Plaid consent',await providerGateway('consent',{accepted:true,scopes:['auth','transactions','balances']}));
}
async function plaidStart(){
  const body=await providerGateway('begin_connect');
  writeChain({plaidSessionId:body.sessionId});
  log('Plaid Hosted Link created',{sessionId:body.sessionId,expiresAt:body.expiresAt,hostedLinkUrl:'[opened in new tab]'});
  window.open(body.hostedLinkUrl,'_blank','noopener,noreferrer');
}
async function plaidFinalize(){
  if(!chain.plaidSessionId)throw new Error('Start Plaid Hosted Link first.');
  const body=await providerGateway('finalize_connect',{sessionId:chain.plaidSessionId});
  if(body.connectionId)writeChain({plaidConnectionId:body.connectionId});
  log('Plaid connection finalize',body);
  if(body.status==='pending')log('Plaid pending','Finish the Hosted Link flow, then press Finalize again.');
  await plaidAccounts();
}
async function plaidAccounts(){
  const body=await providerGateway('accounts');
  providerAccounts=body.accounts||[];
  fillSelect('plaidAccountSelect',providerAccounts,x=>x.id,x=>(x.displayName||x.name||'Plaid account')+(x.mask?' •••• '+x.mask:''),'No Plaid accounts');
  log('Plaid accounts',body);
}
async function plaidUnitLink(){
  const providerAccountRowId=$('plaidAccountSelect').value;
  if(!providerAccountRowId)throw new Error('Select a Plaid account.');
  const body=await gateway('plaid_unit_funding_link',{providerAccountRowId,clientRequestId:requestId('plaid_unit')});
  log('Plaid → Unit funding link',body);
  await refreshChain();
}
async function externalFund(){
  const depositAccountId=$('unitDepositSelect').value;
  const funding=moneySummary?.fundingAccounts?.find(x=>x.processor_provider==='unit'&&x.status==='verified');
  if(!depositAccountId||!funding)throw new Error('Create the Unit account and Plaid → Unit funding link first.');
  const terms='This Week Sandbox ACH debit authorization: '+cents($('externalFundAmount').value)+' cents';
  const body=await gateway('unit_fund_from_external',{
    fundingAccountId:funding.id,
    depositAccountId,
    amountCents:cents($('externalFundAmount').value),
    clientRequestId:requestId('unit_ach_pull'),
    termsVersion:'sandbox-2026-09',
    consentTextHash:await sha256Text(terms)
  });
  log('External ACH pull submitted',body);
  await refreshChain();
}
async function createCard(){
  const depositAccountId=$('unitDepositSelect').value,envelopeId=$('cardEnvelopeSelect').value;
  if(!depositAccountId||!envelopeId)throw new Error('Select a Unit account and envelope.');
  const env=moneySummary?.envelopes?.find(x=>x.id===envelopeId);
  const body=await gateway('create_virtual_card',{
    depositAccountId,envelopeId,cardMode:'category',
    label:(env?.label||'Category')+' Sandbox Card',
    spendLimitCents:cents($('cardLimit').value),
    clientRequestId:requestId('unit_card')
  });
  log('Unit category card',body);
  await refreshChain();
}
async function simulateAuth(){
  const cardId=$('cardSelect').value;
  if(!cardId)throw new Error('Select a Unit virtual card.');
  const body=await gateway('unit_sandbox_authorization',{
    cardId,amountCents:cents($('authAmount').value),
    merchantName:'This Week Sandbox Market',merchantType:5411
  });
  log('Unit purchase authorization simulation',body);
  await refreshChain();
}
async function directDepositToken(){
  const depositAccountId=$('unitDepositSelect').value;
  if(!depositAccountId)throw new Error('Select a Unit deposit account.');
  const body=await gateway('direct_deposit_link',{depositAccountId});
  pinwheelToken=body.linkToken||null;
  log('Pinwheel Deposit Switch token created',{switch:body.switch,expires:body.expires,mode:body.mode,linkToken:'[kept in memory only]'});
  if(!pinwheelToken)throw new Error('Pinwheel did not return a Link token.');
  if(!window.Pinwheel?.open)throw new Error('Pinwheel Web SDK did not load.');
  window.Pinwheel.open({
    linkToken:pinwheelToken,
    useSecureOrigin:true,
    onSuccess:(event)=>{log('Pinwheel success',event);pinwheelToken=null;refreshChain().catch(()=>{});},
    onExit:(event)=>{log('Pinwheel exit',event||{});pinwheelToken=null;},
    onError:(event)=>log('Pinwheel error',event||{})
  });
}
async function methodSetup(){
  const body=await gateway('method_sandbox_setup');
  log('Method dev setup',body);
  await refreshChain();
}
async function methodPay(){
  const fundingAccountId=$('methodSourceSelect').value,billerId=$('methodBillerSelect').value,envelopeId=$('methodEnvelopeSelect').value;
  if(!fundingAccountId||!billerId||!envelopeId)throw new Error('Run Method setup and select source, liability, and envelope.');
  const amountCents=cents($('methodPayAmount').value);
  const consentTextHash=await sha256Text('This Week Method Sandbox bill payment '+amountCents+' cents');
  const body=await gateway('method_sandbox_payment',{
    fundingAccountId,billerId,envelopeId,amountCents,
    clientRequestId:requestId('method_pay'),
    termsVersion:'sandbox-2026-09',consentTextHash
  });
  log('Method Sandbox bill payment',body);
  await refreshChain();
}
async function registerWebhooks(){
  const body=await gateway('register_sandbox_webhooks');
  log('Provider webhook registrations',body);
  return body;
}

async function gatewayStatus(){const body=await gateway('status');$('moneyMode').textContent=body.executionMode||'unknown';log('Gateway status',body);}
async function gatewayBootstrap(){log('Money profile bootstrap',await gateway('bootstrap'));}
async function gatewaySummary(){log('Ledger summary',await gateway('summary'));}
async function sandboxCredit(){log('Sandbox credit',await gateway('sandbox_credit',{amountCents:cents($('sandboxAmount').value),clientRequestId:requestId('lab_credit')}));}
async function allocate(){log('Envelope allocation',await gateway('allocate',{amountCents:cents($('allocateAmount').value),envelopeKey:$('envelope').value,clientRequestId:requestId('lab_allocate')}));}
function bind(id,fn){$(id).addEventListener('click',()=>fn().catch(e=>log('Error',e.message)));}
bind('signIn',signIn);bind('signUp',signUp);bind('signOut',signOut);bind('enrollMfa',enrollMfa);bind('verifyMfa',verifyMfa);bind('gatewayStatus',gatewayStatus);bind('gatewayBootstrap',gatewayBootstrap);bind('gatewaySummary',gatewaySummary);bind('sandboxCredit',sandboxCredit);bind('allocate',allocate);bind('chainRefresh',refreshChain);bind('unitApplication',unitApplication);bind('unitApplicationStatus',unitApplicationStatus);bind('unitDeposit',unitDeposit);bind('unitDirectFund',unitDirectFund);bind('plaidConsent',plaidConsent);bind('plaidStart',plaidStart);bind('plaidFinalize',plaidFinalize);bind('plaidAccounts',plaidAccounts);bind('plaidUnitLink',plaidUnitLink);bind('externalFund',externalFund);bind('createCard',createCard);bind('simulateAuth',simulateAuth);bind('directDepositToken',directDepositToken);bind('methodSetup',methodSetup);bind('methodPay',methodPay);bind('registerWebhooks',registerWebhooks);
updateUi();renderFactors();if(session?.access_token)getUser().then(()=>refreshChain()).catch(e=>{log('Session restore failed',e.message);writeSession(null);});
