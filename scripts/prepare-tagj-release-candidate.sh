#!/bin/sh
set -eu

sh scripts/build-tagj-preview.sh
node scripts/check-tagj-package.mjs

version=$(cat .tagj-dist/VERSION.txt)
commit=${GITHUB_SHA:-${VERCEL_GIT_COMMIT_SHA:-unknown}}
mkdir -p .tagj-dist/.release

node - <<'NODE'
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const root='.tagj-dist';
const skip=new Set(['.release/checksums.sha256','.release/release-candidate.json']);
const files=[];
const walk=dir=>{
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,ent.name);
    if(ent.isDirectory())walk(p);
    else{
      const rel=path.relative(root,p).replaceAll(path.sep,'/');
      if(skip.has(rel))continue;
      const buf=fs.readFileSync(p);
      files.push({path:rel,size:buf.length,sha256:crypto.createHash('sha256').update(buf).digest('hex')});
    }
  }
};
walk(root);
files.sort((a,b)=>a.path.localeCompare(b.path));
fs.writeFileSync(path.join(root,'.release/checksums.sha256'),files.map(x=>x.sha256+'  '+x.path).join('\n')+'\n');
const build=JSON.parse(fs.readFileSync(path.join(root,'build-manifest.json'),'utf8'));
const candidate={
  schemaVersion:1,
  createdAt:new Date().toISOString(),
  version:build.version,
  commit:build.commit||process.env.GITHUB_SHA||null,
  mode:build.mode,
  fileCount:files.length,
  totalBytes:files.reduce((n,x)=>n+x.size,0),
  currentRelease:build.currentRelease,
  beatPreviewMode:build.beatPreviewMode,
  publicBlockers:build.launch?.publicBlockers||[],
  checksums:'.release/checksums.sha256'
};
fs.writeFileSync(path.join(root,'.release/release-candidate.json'),JSON.stringify(candidate,null,2)+'\n');
NODE

printf 'Prepared %s release candidate for %s\n' "$version" "$commit"
