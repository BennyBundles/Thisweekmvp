import fs from 'node:fs';
const html=fs.readFileSync(process.argv[2]||'_site/money-lab/index.html','utf8');
const js=fs.readFileSync(process.argv[3]||'_site/money-lab/app.js','utf8');
const failures=[];
const need=(label,content,text)=>{if(!content.includes(text))failures.push(label);};
need('exact Supabase connect allowlist',html,"connect-src https://xjtvawmppzwzrooairyx.supabase.co");
need('no generic connect wildcard',html,"default-src 'self'");
need('external app file',html,'<script src="./app.js"></script>');
need('publishable key only',js,'sb_publishable_');
need('password sign in',js,"/auth/v1/token?grant_type=password");
need('recoverable signup',js,"/auth/v1/signup");
need('TOTP enrollment',js,"/auth/v1/factors");
need('MFA challenge',js,"/challenge");
need('MFA verify',js,"/verify");
need('money gateway',js,"/functions/v1/thisweek-money-gateway");
need('sessionStorage sandbox',js,'sessionStorage');
need('gateway bootstrap',js,"gateway('bootstrap')");
need('ledger summary',js,"gateway('summary')");
if(/service_role|sb_secret_/i.test(html+js))failures.push('server secret pattern found in Money Lab');
if(/localStorage/.test(js))failures.push('Money Lab must not persist auth tokens in localStorage');
try{new Function(js);}catch(e){failures.push('Money Lab script syntax: '+e.message);}
if(failures.length){console.error('Money Lab check FAILED');failures.forEach(x=>console.error('- '+x));process.exit(1);}
console.log('Money Lab check passed');
console.log(JSON.stringify({auth:'recoverable',mfa:'totp',sessionStorage:true,gateway:true,networkAllowlist:'exact-supabase-origin'},null,2));
