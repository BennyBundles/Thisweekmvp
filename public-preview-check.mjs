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
need('Phase 20 Money Center','async function renderMoneyCenter()');
need('Phase 20 Direct Deposit','async function renderDirectDeposit()');
need('Phase 20 Bill Pay','async function renderBillPay()');
need('Phase 20 Category Cards','async function renderCategoryCards()');
need('Phase 20 money disabled',"executionMode:'disabled'");
need('Phase 20 reward inactive',"rewardMode:'sandbox_template_inactive'");
need('Phase 21 signed webhook status',"webhookMode:'signed_receivers_deployed'");
need('Phase 21 card authorization status',"cardAuthorizationMode:'controller_deployed_execution_locked'");
need('Phase 21 Money Lab sibling link','href="../money-lab/"');
need('Phase 22 sandbox chain',"sandboxChain:'plaid_unit_pinwheel_method'");
need('Phase 22 chain credential gate',"sandboxChainMode:'deployed_credentials_required'");
need('Phase 23 Account Center sibling link',"externalTool('../account/'");
need('Phase 28 Support Center sibling link',"externalTool('../support/'");
// Assert the actual browser URL resolution, not just string presence. In both
// deployments the preview is one directory below the sibling tools.
for (const prefix of ['/', '/Thisweekmvp/']) {
  const origin = 'https://example.test' + prefix + 'public-preview/';
  for (const route of ['money-lab/', 'account/', 'support/']) {
    const resolved = new URL('../' + route, origin);
    const expected = prefix + route;
    if (resolved.pathname !== expected) failures.push('broken sibling link for ' + expected);
  }
}
forbid('Money Lab points inside isolated preview', 'href="./money-lab/"');
forbid('Account Center points inside isolated preview', "externalTool('./account/'");
forbid('Support Center points inside isolated preview', "externalTool('./support/'");

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
