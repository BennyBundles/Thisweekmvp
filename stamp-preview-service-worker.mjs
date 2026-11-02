#!/usr/bin/env node
/**
 * Deterministically bind the public-preview service worker cache generation to
 * the exact staged shell, manifest, icon and service-worker source bytes.
 * Neither timestamps nor git SHA enter the identity, so identical artifacts
 * produce identical output on GitHub Pages and Vercel.
 *
 * Usage:
 *   node stamp-preview-service-worker.mjs [--verify] SHELL MANIFEST ICON SOURCE WORKER_OUT
 */
import fs from 'node:fs';
import {createHash} from 'node:crypto';

const args=process.argv.slice(2);
const verify=args[0]==='--verify';
const paths=verify?args.slice(1):args;
if(paths.length!==5)throw new Error('Expected SHELL MANIFEST ICON SOURCE WORKER_OUT');
const [shellPath,manifestPath,iconPath,sourcePath,outPath]=paths;
const inputs=[['shell',shellPath],['manifest',manifestPath],['icon',iconPath],['worker-source',sourcePath]];
const assetDigests={};
const hash=createHash('sha256');
hash.update('thisweek-public-preview-build-v1\0');
for(const [label,path] of inputs){
  if(!fs.existsSync(path)||!fs.statSync(path).isFile()||!fs.statSync(path).size)
    throw new Error('Required nonempty build asset absent: '+label);
  const bytes=fs.readFileSync(path);
  if(label!=='worker-source')assetDigests[label]=createHash('sha256').update(bytes).digest('hex');
  hash.update(label+'\0'+bytes.length+'\0');
  hash.update(bytes);
}
const fingerprint=hash.digest('hex');
const source=fs.readFileSync(sourcePath,'utf8');
const marker="const CACHE_NAME=CACHE_PREFIX+'v4';";
if(source.split(marker).length!==2)
  throw new Error('Expected exact v4 Service Worker source marker once');
const digestMarker='const EXPECTED_ASSET_SHA256=null;';
if(source.split(digestMarker).length!==2)
  throw new Error('Expected exact unstamped digest sentinel once');
const digestLiteral='const EXPECTED_ASSET_SHA256=Object.freeze('+JSON.stringify({
  shell:assetDigests.shell,manifest:assetDigests.manifest,icon:assetDigests.icon})+');';
const stamped=source.replace(marker,
  "const CACHE_NAME=CACHE_PREFIX+'b"+fingerprint+"';")
  .replace(digestMarker,digestLiteral);
if(!stamped.includes("CACHE_PREFIX+'b"+fingerprint+"'")||
    !stamped.includes(digestLiteral)||stamped.includes(digestMarker))
  throw new Error('Offline cache fingerprint/digest substitution failed');
if(verify){
  if(!fs.existsSync(outPath)||fs.readFileSync(outPath,'utf8')!==stamped)
    throw new Error('Offline worker does not match exact staged assets: '+outPath);
}else{
  fs.writeFileSync(outPath,stamped);
}
console.log(JSON.stringify({status:'PASS',mode:verify?'verify':'stamp',
  cacheGeneration:'b'+fingerprint,sourceAssets:inputs.map(([label])=>label),
  integrityDigests:assetDigests}));
