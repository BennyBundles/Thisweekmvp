import fs from 'node:fs';
const html=fs.readFileSync(process.argv[2]||'_site/support/index.html','utf8');
const js=fs.readFileSync(process.argv[3]||'_site/support/app.js','utf8');
const failures=[];const need=(l,c,t)=>{if(!c.includes(t))failures.push(l);};
need('exact Supabase connect allowlist',html,'connect-src https://xjtvawmppzwzrooairyx.supabase.co');
need('support gateway',js,'/functions/v1/thisweek-support-gateway');
need('shared session',js,'thisweek.auth.session.v1');
need('request creation',js,"support('create_request'");
need('support reply',js,"support('add_message'");
need('sensitive token rejection',js,'access[-_ ]?token');
need('full number rejection',js,'\\d{12,19}');
need('no direct money mutation copy',html,'never directly changes or refunds money');
if(/service_role|sb_secret_/i.test(html+js))failures.push('server-secret-shaped value in Support Center');
if(/localStorage/.test(js))failures.push('Support Center must not persist auth in localStorage');
try{new Function(js);}catch(e){failures.push('Support Center script syntax: '+e.message);}
if(failures.length){console.error('Support Center check FAILED');failures.forEach(x=>console.error('- '+x));process.exit(1);}
console.log('Support Center check passed');
console.log(JSON.stringify({gateway:true,sessionStorage:true,directMoneyMutation:false,sensitiveInputGuard:true},null,2));
