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

const breadcrumbPaths={
  '/artist':[['Home','/'],['Benny Bundles','/artist']],
  '/producer':[['Home','/'],['Benny Bundles','/artist'],['Producer / Engineer','/producer']],
  '/creative':[['Home','/'],['Creative Services','/creative']],
  '/tagj':[['Home','/'],['TAGJ','/tagj']],
  '/contact':[['Home','/'],['Contact','/contact']],
  '/licensing':[['Home','/'],['Producer / Engineer','/producer'],['Beat Licensing','/licensing']],
  '/services':[['Home','/'],['Services','/services']],
  '/beats':[['Home','/'],['Producer / Engineer','/producer'],['Beat Vault','/beats']],
  '/catalogue':[['Home','/'],['TAGJ','/tagj'],['Catalogue','/catalogue']],
  '/music':[['Home','/'],['Benny Bundles','/artist'],['Music','/music']],
  '/music/wanted-me-gone':[['Home','/'],['Benny Bundles','/artist'],['Music','/music'],['Wanted Me Gone','/music/wanted-me-gone']],
  '/music/hold-something':[['Home','/'],['Benny Bundles','/artist'],['Music','/music'],['Hold Something','/music/hold-something']],
  '/music/cant-crop-karma':[['Home','/'],['Benny Bundles','/artist'],['Music','/music'],['Can’t Crop Karma','/music/cant-crop-karma']],
  '/music/freestyle':[['Home','/'],['Benny Bundles','/artist'],['Music','/music'],['FREESTYLE','/music/freestyle']],
  '/music/cried-in-the-dark':[['Home','/'],['Benny Bundles','/artist'],['Music','/music'],['Cried in the Dark','/music/cried-in-the-dark']],
  '/music/the-whole-brand':[['Home','/'],['Benny Bundles','/artist'],['Music','/music'],['The Whole Brand','/music/the-whole-brand']],
  '/network':[['Home','/'],['Benny Bundles','/artist'],['Artist Network','/network']],
  '/network/bsf-tone-066':[['Home','/'],['Benny Bundles','/artist'],['Artist Network','/network'],['BSF Tone 066','/network/bsf-tone-066']],
  '/network/t311y-demon-life':[['Home','/'],['Benny Bundles','/artist'],['Artist Network','/network'],['T311Y Demon Life','/network/t311y-demon-life']],
  '/creative/portfolio':[['Home','/'],['Creative Services','/creative'],['Portfolio','/creative/portfolio']],
  '/creative/case-bsf-tone-066':[['Home','/'],['Creative Services','/creative'],['Portfolio','/creative/portfolio'],['BSF Tone 066 Case Study','/creative/case-bsf-tone-066']],
  '/creative/case-t311y-demon-life':[['Home','/'],['Creative Services','/creative'],['Portfolio','/creative/portfolio'],['T311Y Demon Life Case Study','/creative/case-t311y-demon-life']]
};

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

const ensureSocialMeta=src=>{
  const title=(src.match(/<title>([\s\S]*?)<\/title>/i)?.[1]||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  const description=(src.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i)?.[1]||'').trim();
  const add=(tag,re)=>{ if(!re.test(src)) src=src.replace(/<\/head>/i,tag+'</head>'); };
  if(title){
    add('<meta property="og:title" content="'+esc(title)+'">',/<meta\b[^>]*property=["']og:title["']/i);
    add('<meta name="twitter:title" content="'+esc(title)+'">',/<meta\b[^>]*name=["']twitter:title["']/i);
  }
  if(description){
    add('<meta property="og:description" content="'+esc(description)+'">',/<meta\b[^>]*property=["']og:description["']/i);
    add('<meta name="twitter:description" content="'+esc(description)+'">',/<meta\b[^>]*name=["']twitter:description["']/i);
  }
  add('<meta property="og:type" content="website">',/<meta\b[^>]*property=["']og:type["']/i);
  add('<meta name="twitter:card" content="summary">',/<meta\b[^>]*name=["']twitter:card["']/i);

  let thumb='';
  for(const m of src.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
    try{
      const data=JSON.parse(m[1]);
      if(data?.['@type']!=='MusicRecording') continue;
      const videos=Array.isArray(data.subjectOf)?data.subjectOf:[data.subjectOf].filter(Boolean);
      thumb=videos.find(v=>v?.['@type']==='VideoObject'&&v.thumbnailUrl)?.thumbnailUrl||'';
      if(thumb)break;
    }catch(_){}
  }
  if(thumb){
    add('<meta property="og:image" content="'+esc(thumb)+'">',/<meta\b[^>]*property=["']og:image["']/i);
    add('<meta name="twitter:image" content="'+esc(thumb)+'">',/<meta\b[^>]*name=["']twitter:image["']/i);
    src=src.replace(/<meta\b[^>]*name=["']twitter:card["'][^>]*>/i,'<meta name="twitter:card" content="summary_large_image">');
  }
  return src;
};

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
  src=ensureSocialMeta(src);
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
    const crumbs=breadcrumbPaths[route];
    if(crumbs&&crumbs.length>=2){
      const schema={
        '@context':'https://schema.org',
        '@type':'BreadcrumbList',
        itemListElement:crumbs.map(([name,item],i)=>({
          '@type':'ListItem',
          position:i+1,
          name,
          item:origin+item
        }))
      };
      const tag='<script id="tagj-breadcrumb-schema" type="application/ld+json">'+JSON.stringify(schema)+'</script>';
      src=src.replace(/<script\b[^>]*id=["']tagj-breadcrumb-schema["'][^>]*>[\s\S]*?<\/script>/i,tag);
      if(!src.includes('id="tagj-breadcrumb-schema"')) src=src.replace(/<\/head>/i,tag+'</head>');
    }
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
