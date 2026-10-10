(()=>{
  'use strict';
  const d=document;
  const frames=[...d.querySelectorAll('iframe[data-video-src]')];
  if(!frames.length)return;

  const style=d.createElement('style');
  style.textContent=[
    '.tagj-video-gate{position:absolute;inset:0;width:100%;height:100%;border:0;padding:0;display:grid;place-items:center;overflow:hidden;background:#05080c center/cover no-repeat;color:#fff;cursor:pointer;text-align:center}',
    '.tagj-video-gate:before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.72)),radial-gradient(circle at 50% 45%,transparent 0 18%,rgba(0,0,0,.15) 60%)}',
    '.tagj-video-gate-inner{position:relative;z-index:2;display:grid;place-items:center;gap:10px;padding:18px}',
    '.tagj-video-play{width:68px;height:68px;border-radius:50%;display:grid;place-items:center;background:rgba(245,247,248,.94);color:#080b0e;box-shadow:0 18px 60px rgba(0,0,0,.38)}',
    '.tagj-video-play:before{content:"";width:0;height:0;border-top:10px solid transparent;border-bottom:10px solid transparent;border-left:17px solid currentColor;margin-left:4px}',
    '.tagj-video-gate b{font-size:12px;letter-spacing:.08em;text-transform:uppercase}',
    '.tagj-video-gate small{max-width:420px;font:700 8px/1.5 ui-monospace,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase;color:#c7d0d4}',
    '.tagj-video-loading .tagj-video-play{animation:tagjVideoPulse .7s ease-in-out infinite alternate}@keyframes tagjVideoPulse{to{transform:scale(.92);opacity:.7}}',
    '@media(prefers-reduced-motion:reduce){.tagj-video-loading .tagj-video-play{animation:none!important}}'
  ].join('');
  d.head.appendChild(style);

  frames.forEach((frame,index)=>{
    const src=frame.dataset.videoSrc;
    if(!src)return;
    const shell=frame.parentElement;
    if(!shell)return;
    const cs=getComputedStyle(shell);
    if(cs.position==='static')shell.style.position='relative';

    frame.hidden=true;
    frame.removeAttribute('src');
    const gate=d.createElement('button');
    gate.type='button';
    gate.className='tagj-video-gate';
    gate.setAttribute('aria-label','Play '+(frame.title||'official video'));
    const poster=frame.dataset.poster||'';
    if(poster)gate.style.backgroundImage='url("'+poster.replace(/"/g,'%22')+'")';
    const label=frame.dataset.playLabel||frame.title||'Official video';
    gate.innerHTML='<span class="tagj-video-gate-inner"><span class="tagj-video-play" aria-hidden="true"></span><b>Play video</b><small></small></span>';
    gate.querySelector('small').textContent=label+' · YouTube loads only after you press play.';

    gate.addEventListener('click',()=>{
      gate.classList.add('tagj-video-loading');
      const u=new URL(src,location.href);
      if(!u.searchParams.has('autoplay'))u.searchParams.set('autoplay','1');
      frame.addEventListener('load',()=>{
        frame.hidden=false;
        gate.remove();
      },{once:true});
      frame.src=u.href;
      setTimeout(()=>{if(frame.hidden){frame.hidden=false;gate.remove()}},5000);
    },{once:true});
    shell.appendChild(gate);
  });
})();