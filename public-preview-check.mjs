import fs from 'node:fs';

const file=process.argv[2]||'_site/public-preview/index.html';
if(!fs.existsSync(file))throw new Error('Missing public preview: '+file);
const html=fs.readFileSync(file,'utf8');
const failures=[];
const need=(label,text)=>{if(!html.includes(text))failures.push(label);};
const forbid=(label,text)=>{if(html.includes(text))failures.push(label);};

need('public preview title','This Week — Public Release Preview');
need('isolated state key','thisweek.publicPreview.state.v2');
need('isolated user key','thisweek.publicPreview.userId');
need('isolated connected-data key','thisweek.publicPreview.connectedData.v1');
need('preview build marker',"channel:'public-release-preview'");
need('demo seeder','seedPublicReleaseDemo');
need('fresh/reset isolation','clearPublicPreviewStorage');
need('manifest link','./manifest.webmanifest');
need('service worker registration',"navigator.serviceWorker.register('./sw.js'");
need('worker CSP',"worker-src 'self'");
need('network deny',"connect-src 'none'");
need('provider still disabled','enabled:false');
need('Home renderer','async function renderHome()');
need('Details renderer','async function renderDetails()');
need('Plan renderer','function renderSetup()');
need('Connected Data renderer','async function renderConnections()');
forbid('production state key leaked','"thisweek.state.v2"');
forbid('production user key leaked','"thisweek.userId"');

const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
if(scripts.length!==2)failures.push('Expected exactly 2 inline scripts; found '+scripts.length);
for(let i=0;i<scripts.length;i++){
  try{new Function(scripts[i]);}catch(e){failures.push('Script '+(i+1)+' compile failure: '+e.message);}
}
if(failures.length){
  console.error('Public preview check failed:');
  failures.forEach(x=>console.error('- '+x));
  process.exit(1);
}
console.log('Public preview check passed.');
console.log(JSON.stringify({file,scripts:scripts.length,isolatedStorage:true,providerNetworking:false,navigable:true,pwa:true},null,2));
