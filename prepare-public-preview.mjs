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
if('serviceWorker' in navigator&&location.protocol==='https:'){
  navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});
}
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
