import fs from 'node:fs';

const [input='index.html',output='public-preview.source.html']=process.argv.slice(2);
if(!fs.existsSync(input))throw new Error('Missing input HTML: '+input);

let html=fs.readFileSync(input,'utf8');

const storageKeys=[
  'thisweek.userId',
  'thisweek.state.v2',
  'thisweek.uiPrefs.v1',
  'thisweek.powerPrefs.v1',
  'thisweek.savingsGoals.v1',
  'thisweek.connectedData.v1',
  'thisweek.recommendations.v1',
  'thisweek.scenarioDraft.v1',
  'thisweek.analytics.v1',
  'thisweek.flexCaps.v1',
  'thisweek.precheckHint.v1',
  'thisweek.finEvent.v1',
  'thisweek.qa.roundtrip'
];
for(const key of storageKeys){
  if(!html.includes(key))throw new Error('Preview isolation key missing from source: '+key);
  html=html.replaceAll(key,key.replace('thisweek.','thisweek.publicPreview.'));
}

// The standalone PWA is hosted under /public-preview/ on Vercel and Pages.
// Sibling routes must go one level up; original production HTML is unaffected.
for (const [from,to] of [
  ['href="./money-lab/"','href="../money-lab/"'],
  ["externalTool('./account/'","externalTool('../account/'"],
  ["externalTool('./support/'","externalTool('../support/'"]
]) {
  const n=html.split(from).length-1;
  if(n!==1)throw new Error('Preview route signature missing or ambiguous: '+from);
  html=html.replace(from,to);
}

html=html.replace(/<title>[^<]*<\/title>/,'<title>This Week — Public Release Preview</title>');
html=html.replace('worker-src \'none\'',"worker-src 'self'");

const headInsert=`
<link rel="manifest" href="./manifest.webmanifest">
<link rel="icon" href="./icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="./icon.svg">
<meta name="application-name" content="This Week">
<meta name="apple-mobile-web-app-title" content="This Week">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="description" content="This Week is a private, mobile-first weekly financial planning workspace.">
`;
if(!html.includes('</head>'))throw new Error('Missing </head>');
html=html.replace('</head>',headInsert+'\n</head>');

const boot=`
const PUBLIC_PREVIEW_BUILD=Object.freeze({
  channel:'public-release-preview',
  isolatedStoragePrefix:'thisweek.publicPreview.',
  providerNetworking:false,
  packageMode:'pwa-preview'
});
function clearPublicPreviewStorage(){
  try{
    for(let i=localStorage.length-1;i>=0;i--){
      const k=localStorage.key(i);
      if(k&&k.startsWith(PUBLIC_PREVIEW_BUILD.isolatedStoragePrefix))localStorage.removeItem(k);
    }
  }catch{}
  try{
    for(let i=sessionStorage.length-1;i>=0;i--){
      const k=sessionStorage.key(i);
      if(k&&k.startsWith(PUBLIC_PREVIEW_BUILD.isolatedStoragePrefix))sessionStorage.removeItem(k);
    }
  }catch{}
}
function seedPublicReleaseDemo(){
  if(getStoredUserId())return;
  const userId='release_preview_'+uid();
  const demo=clone(DEMO_PRESET);
  const now=Date.now();
  demo.payProfile={...demo.payProfile,payAnchorAt:new Date(now-2*DAY_MS).toISOString()};
  demo.bills=(demo.bills||[]).map((b,i)=>({...b,dueDate:new Date(now+(8+i*9)*DAY_MS).toISOString()}));
  localApi('/setup',{method:'POST',body:JSON.stringify({...demo,userId})});
  localApi('/week/current',{method:'POST',body:JSON.stringify({userId})});
  const state=readState();
  const week=state?.weeks?.filter(w=>!w.closed).sort((a,b)=>b.start.localeCompare(a.start))[0];
  if(!state||!week)return;
  runGenerators(state,week);
  const examples=[
    {type:'LIVING',amount:3825,note:'Preview grocery run'},
    {type:'LIVING',amount:2100,note:'Preview fuel'},
    {type:'DISCRETIONARY',amount:2450,note:'Preview lunch'}
  ];
  const used=new Set();
  for(const example of examples){
    const balance=week.balances.find(b=>b.categoryType===example.type&&!used.has(b.categoryId)&&b.remaining>example.amount);
    if(!balance)continue;
    used.add(balance.categoryId);
    state.transactions.push({
      id:uid(),weekId:week.id,categoryType:balance.categoryType,categoryId:balance.categoryId,
      amount:example.amount,note:example.note,createdAt:nowIso(),source:'preview-demo'
    });
    balance.spent+=example.amount;
    balance.remaining-=example.amount;
  }
  const bill=week.billAllocations?.[0];
  if(bill){
    const target=Math.max(0,Math.min(bill.weeklyRequired,Math.round(bill.weeklyRequired*.58)));
    bill.contributed=Math.max(bill.contributed||0,target);
  }
  runGenerators(state,week);
  writeState(state);
}
const PUBLIC_PREVIEW_QUERY=new URLSearchParams(location.search);
if(PUBLIC_PREVIEW_QUERY.get('reset')==='1')clearPublicPreviewStorage();
const PUBLIC_PREVIEW_MODE=PUBLIC_PREVIEW_QUERY.get('mode')||'demo';
if(PUBLIC_PREVIEW_MODE==='demo')seedPublicReleaseDemo();
// Safari cannot use offline navigation until a worker controls this page
// and the current release's exact offline cache has been verified.
const offlinePanel=document.createElement('section');
offlinePanel.id='thisweek-offline-readiness';
offlinePanel.setAttribute('role','status');
offlinePanel.setAttribute('aria-live','polite');
offlinePanel.style.cssText='margin:8px 16px 10px;padding:10px 12px;background:#122739;border:1px solid #5e8093;border-radius:14px;color:#fff;font:600 13px system-ui,sans-serif;display:flex;align-items:center;justify-content:space-between;gap:8px;';
const offlineLabel=document.createElement('span');
offlineLabel.textContent='Offline: checking setup…';
const offlineRetry=document.createElement('button');
offlineRetry.type='button';
offlineRetry.textContent='Check again';
offlineRetry.style.cssText='background:#183b50;color:#fff;border:1px solid #729bb0;border-radius:10px;padding:8px 9px;font:600 12px system-ui,sans-serif;min-height:36px;';
offlinePanel.append(offlineLabel,offlineRetry);
document.querySelector('.topbar')?.insertAdjacentElement('afterend',offlinePanel);
function offlineSetStatus(kind,detail){
  offlinePanel.dataset.state=kind;
  offlinePanel.style.borderColor=kind==='ready'?'#3acda5':kind==='checking'?'#5e8093':'#f0ba78';
  offlineLabel.textContent=detail;
}
function offlineDeadline(promise,ms){
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('TIMEOUT')),ms);
    Promise.resolve(promise).then(value=>{clearTimeout(timer);resolve(value);},
      error=>{clearTimeout(timer);reject(error)});
  });
}
function inspectOfflineWorker(){
  return new Promise((resolve,reject)=>{
    const worker=navigator.serviceWorker.controller;
    if(!worker){reject(new Error('NOT_CONTROLLING'));return;}
    const channel=new MessageChannel();
    const timer=setTimeout(()=>{
      channel.port1.close();reject(new Error('WORKER_NO_REPLY'));
    },7000);
    channel.port1.onmessage=event=>{
      clearTimeout(timer);channel.port1.close();
      const answer=event.data;
      if(!answer||answer.type!=='THISWEEK_OFFLINE_STATUS'){
        reject(new Error('UNEXPECTED_WORKER_REPLY'));return;
      }
      resolve(answer);
    };
    try{worker.postMessage({type:'THISWEEK_OFFLINE_CHECK'},[channel.port2]);}
    catch(error){clearTimeout(timer);channel.port1.close();reject(error);}
  });
}
let offlineProbeSerial=0;
async function checkPublicOfflineReadiness(){
  const seq=++offlineProbeSerial;
  offlineSetStatus('checking','Offline: checking setup…');
  if(!('serviceWorker' in navigator)||location.protocol!=='https:'){
    offlineSetStatus('error','Offline not ready: browser does not support this setup');
    return;
  }
  if(!navigator.onLine&&!navigator.serviceWorker.controller){
    offlineSetStatus('error','Offline not ready: reconnect, then tap Check again');
    return;
  }
  try{
    const registration=await offlineDeadline(
      navigator.serviceWorker.register('./sw.js',{scope:'./'}),12000);
    const expectedScope=new URL('./',location.href).href;
    if(registration.scope!==expectedScope)throw new Error('WRONG_SCOPE');
    await offlineDeadline(navigator.serviceWorker.ready,12000);
    if(seq!==offlineProbeSerial)return;
    if(!navigator.serviceWorker.controller){
      offlineSetStatus('error','Offline installed but not controlling this tab. Refresh once while online.');
      return;
    }
    const answer=await inspectOfflineWorker();
    if(seq!==offlineProbeSerial)return;
    if(!answer.ready||answer.scope!==expectedScope)
      throw new Error(answer.code||'INVALID_OFFLINE_CACHE');
    offlineSetStatus('ready','Offline ready — you can test Airplane Mode');
  }catch(error){
    if(seq!==offlineProbeSerial)return;
    const code=String(error?.name==='SecurityError'?'SECURITY_ERROR':
      error?.message||'UNKNOWN_ERROR').replace(/[^A-Z0-9_]/gi,'_').slice(0,44);
    offlineSetStatus('error','Offline not ready: '+code+'. Stay online; retry later.');
  }
}
offlineRetry.addEventListener('click',checkPublicOfflineReadiness);
if('serviceWorker' in navigator){
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(navigator.onLine)checkPublicOfflineReadiness();
  });
}
checkPublicOfflineReadiness();
`;

const marker='render();\n</script></body></html>';
if(!html.includes(marker))throw new Error('Preview boot insertion point not found');
html=html.replace(marker,boot+'\nrender();\n</script></body></html>');

const outDir=output.includes('/')?output.slice(0,output.lastIndexOf('/')):'.';
if(outDir&&outDir!=='.')fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(output,html);

console.log(JSON.stringify({
  input,output,
  bytes:Buffer.byteLength(html),
  storageNamespace:'thisweek.publicPreview.',
  providerNetworking:false,
  mode:'pwa-preview'
},null,2));
