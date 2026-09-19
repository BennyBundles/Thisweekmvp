import fs from 'node:fs';
import {createHash} from 'node:crypto';

const [input='index.html',output='_site/index.html']=process.argv.slice(2);
if(!fs.existsSync(input))throw new Error('Missing input HTML: '+input);

let html=fs.readFileSync(input,'utf8');
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
if(scripts.length!==2)throw new Error('Expected exactly 2 inline application script blocks; found '+scripts.length);

const cspMatch=html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);
if(!cspMatch)throw new Error('Missing Content-Security-Policy meta tag');

const hashes=scripts.map(src=>"'sha256-"+createHash('sha256').update(src,'utf8').digest('base64')+"'");
const directives=cspMatch[1].split(';').map(x=>x.trim()).filter(Boolean);
const idx=directives.findIndex(x=>x.startsWith('script-src '));
if(idx<0)throw new Error('CSP is missing script-src');
if(directives[idx].includes("'unsafe-inline'"))throw new Error('CSP script-src must not allow unsafe-inline');

directives[idx]=["script-src","'self'",...hashes].join(' ');
const nextCsp=directives.join('; ');
html=html.replace(cspMatch[0],`<meta http-equiv="Content-Security-Policy" content="${nextCsp}">`);

const outDir=output.includes('/')?output.slice(0,output.lastIndexOf('/')):'.';
if(outDir&&outDir!=='.')fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(output,html);

const check=fs.readFileSync(output,'utf8');
const stagedCsp=(check.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/)||[])[1]||'';
for(const hash of hashes)if(!stagedCsp.includes(hash))throw new Error('Staged CSP missing '+hash);

console.log(JSON.stringify({
  input,
  output,
  scripts:scripts.length,
  hashes:hashes.length,
  bytes:Buffer.byteLength(check),
  cspRefreshed:true
},null,2));
