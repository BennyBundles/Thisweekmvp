import fs from 'node:fs';
import { createHash } from 'node:crypto';

const file='index.html';
const checkOnly=process.argv.includes('--check');
const html=fs.readFileSync(file,'utf8');
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);

if(scripts.length!==2){
  console.error(`Expected 2 inline script blocks; found ${scripts.length}.`);
  process.exit(1);
}

const hashes=scripts.map(src=>`sha256-${createHash('sha256').update(src,'utf8').digest('base64')}`);
const metaMatch=html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);

if(!metaMatch){
  console.error('Missing Content-Security-Policy meta tag.');
  process.exit(1);
}

const directives=metaMatch[1].split(';').map(x=>x.trim()).filter(Boolean);
const currentScriptDirective=directives.find(x=>x.startsWith('script-src '))||'';
const expectedDirective=`script-src 'self' ${hashes.map(h=>`'${h}'`).join(' ')}`;
const matches=hashes.every(h=>currentScriptDirective.includes(`'${h}'`)) &&
  [...currentScriptDirective.matchAll(/'sha256-[^']+'/g)].length===hashes.length;

if(checkOnly){
  if(!matches){
    console.error('CSP script hashes are stale.');
    console.error('Expected:',expectedDirective);
    process.exit(1);
  }
  console.log('CSP script hashes match the current inline scripts.');
  process.exit(0);
}

const nextCsp=directives.map(d=>d.startsWith('script-src ')?expectedDirective:d).join('; ');
const nextHtml=html.replace(metaMatch[0],`<meta http-equiv="Content-Security-Policy" content="${nextCsp}">`);

if(nextHtml===html){
  console.log('CSP script hashes already current.');
}else{
  fs.writeFileSync(file,nextHtml);
  console.log('Updated CSP hashes:');
  hashes.forEach(h=>console.log(' - '+h));
}
