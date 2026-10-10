#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const dist=path.resolve('.tagj-dist');
if(!fs.existsSync(dist)) throw new Error('.tagj-dist does not exist; run the TAGJ build first');

const routeMap=[
  ['index.html','/'],
  ['full.html','/full'],
  ['artist.html','/artist'],
  ['producer.html','/producer'],
  ['creative.html','/creative'],
  ['tagj.html','/tagj'],
  ['contact.html','/contact'],
  ['licensing.html','/licensing'],
  ['services/index.html','/services'],
  ['beats/index.html','/beats'],
  ['catalogue/index.html','/catalogue'],
  ['music/index.html','/music'],
  ['music/wanted-me-gone.html','/music/wanted-me-gone'],
  ['music/hold-something.html','/music/hold-something'],
  ['music/cant-crop-karma.html','/music/cant-crop-karma'],
  ['music/freestyle.html','/music/freestyle'],
  ['music/cried-in-the-dark.html','/music/cried-in-the-dark'],
  ['music/the-whole-brand.html','/music/the-whole-brand'],
  ['network/index.html','/network'],
  ['network/bsf-tone-066.html','/network/bsf-tone-066'],
  ['network/t311y-demon-life.html','/network/t311y-demon-life'],
  ['creative/portfolio.html','/creative/portfolio'],
  ['creative/case-bsf-tone-066.html','/creative/case-bsf-tone-066'],
  ['creative/case-t311y-demon-life.html','/creative/case-t311y-demon-life']
];

const raw=(process.env.TAGJ_PUBLIC_ORIGIN||'').trim().replace(/\/$/,'');
let origin='';
if(raw){
  try{
    const u=new URL(raw);
    if(!/^https?:$/.test(u.protocol)) throw new Error('origin must use http or https');
    origin=u.origin;
  }catch(err){
    throw new Error('Invalid TAGJ_PUBLIC_ORIGIN: '+err.message);
  }
}

const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');

const absolutizeStructuredData=(src,origin,isHome=false)=>src.replace(
  /<script\b([^>]*)type=["']application\/ld\+json["']([^>]*)>([\s\S]*?)<\/script>/gi,
  (whole,a,b,jsonText)=>{
    try{
      const data=JSON.parse(jsonText);
      const walk=value=>{
        if(Array.isArray(value)) return value.map(walk);
        if(value&&typeof value==='object'){
          for(const [key,val] of Object.entries(value)){
            if(typeof val==='string' && ['@id','url','contentUrl','embedUrl','logo','image','thumbnailUrl'].includes(key) && val.startsWith('/')) value[key]=origin+val;
            else value[key]=walk(val);
          }
        }
        return value;
      };
      walk(data);
      if(isHome){
        const graph=Array.isArray(data['@graph'])?data['@graph']:[data];
        const site=graph.find(x=>x&&x['@type']==='WebSite');
        if(site){
          site['@id']=origin+'/#website';
          site.url=origin+'/';
          site.name='Benny Bundles × TAGJ';
          site.alternateName=['Benny Bundles','TAGJ','That’s A Good Jawn'];
        }
      }
      return '<script'+a+'type="application/ld+json"'+b+'>'+JSON.stringify(data)+'</script>';
    }catch(_){return whole}
  }
);

const upsertHead=(src,tag,matcher)=>{
  if(matcher.test(src)) return src.replace(matcher,tag);
  return src.replace(/<\/head>/i,tag+'</head>');
};

const walkHtml=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
  const p=path.join(dir,entry.name);
  return entry.isDirectory()?walkHtml(p):(entry.isFile()&&entry.name.endsWith('.html')?[p]:[]);
});
const htmlFiles=walkHtml(dist);

// Default-deny indexing. Public mode explicitly promotes only canonical routes below.
for(const p of htmlFiles){
  let src=fs.readFileSync(p,'utf8');
  src=upsertHead(
    src,
    origin?'<meta name="robots" content="noindex,follow">':'<meta name="robots" content="noindex,nofollow,noarchive">',
    /<meta\b[^>]*name=["']robots["'][^>]*>/i
  );
  fs.writeFileSync(p,src);
}

if(origin){
  for(const [file,route] of routeMap){
    const p=path.join(dist,file);
    if(!fs.existsSync(p)) continue;
    let src=fs.readFileSync(p,'utf8');
    const url=origin+route;
    src=upsertHead(src,`<link rel="canonical" href="${esc(url)}">`,/<link\b[^>]*rel=["']canonical["'][^>]*>/i);
    src=upsertHead(src,`<meta property="og:url" content="${esc(url)}">`,/<meta\b[^>]*property=["']og:url["'][^>]*>/i);
    src=src.replace(/<meta\b[^>]*name=["']robots["'][^>]*>/gi,'');
    src=absolutizeStructuredData(src,origin,file==='index.html');
    fs.writeFileSync(p,src);
  }
}

if(origin){
  const now=new Date().toISOString().slice(0,10);
  const urls=routeMap
    .filter(([file])=>fs.existsSync(path.join(dist,file)))
    .map(([,route])=>`  <url><loc>${esc(origin+route)}</loc><lastmod>${now}</lastmod></url>`)
    .join('\n');
  fs.writeFileSync(path.join(dist,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  fs.writeFileSync(path.join(dist,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
  console.log('TAGJ SEO mode: public',origin,'routes:',routeMap.length);
}else{
  fs.rmSync(path.join(dist,'sitemap.xml'),{force:true});
  fs.writeFileSync(path.join(dist,'robots.txt'),'User-agent: *\nDisallow: /\n');
  console.log('TAGJ SEO mode: protected preview / noindex');
}
