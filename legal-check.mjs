import fs from 'node:fs';
const html=fs.readFileSync(process.argv[2]||'legal/sandbox/index.html','utf8');
const failures=[];
const need=(label,text)=>{if(!html.includes(text))failures.push(label);};
need('Sandbox-only banner','SANDBOX TEST ONLY.');
need('noindex','noindex,nofollow');
need('terms anchor','id="terms"');
need('privacy anchor','id="privacy"');
need('esign anchor','id="esign"');
need('ACH anchor','id="ach"');
need('card anchor','id="card"');
need('production disclaimer','not production legal terms');
if(/https?:\/\//i.test(html))failures.push('Sandbox legal fixture should have no external network/link dependency');
if(failures.length){console.error('Legal sandbox check FAILED');for(const x of failures)console.error('- '+x);process.exit(1);}
console.log('Legal sandbox check passed');
