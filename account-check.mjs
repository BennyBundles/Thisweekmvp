import fs from 'node:fs';
const html=fs.readFileSync(process.argv[2]||'_site/account/index.html','utf8');
const js=fs.readFileSync(process.argv[3]||'_site/account/app.js','utf8');
const failures=[];const need=(l,c,t)=>{if(!c.includes(t))failures.push(l);};
need('exact Supabase network allowlist',html,'connect-src https://xjtvawmppzwzrooairyx.supabase.co');
need('account gateway',js,'/functions/v1/thisweek-account-gateway');
need('recoverable signup',js,'/auth/v1/signup');
need('password recovery',js,'/auth/v1/recover');
need('password update',js,"method:'PUT',auth:true");
need('MFA enrollment',js,'/auth/v1/factors');
need('MFA challenge',js,'/challenge');
need('global logout',js,'/auth/v1/logout?scope=global');
need('shared auth session key',js,"thisweek.auth.session.v1");
need('sessionStorage only',js,'sessionStorage');
need('typed deletion confirmation',html,'Type DELETE');
need('financial-history retention copy',html,'Financial history exists');
if(/service_role|sb_secret_/i.test(html+js))failures.push('server secret pattern in Account Center');
if(/localStorage/.test(js))failures.push('Account Center must not persist auth tokens in localStorage');
try{new Function(js);}catch(e){failures.push('Account Center JS syntax: '+e.message);}
if(failures.length){console.error('Account Center check FAILED');failures.forEach(x=>console.error('- '+x));process.exit(1);}
console.log('Account Center check passed');
