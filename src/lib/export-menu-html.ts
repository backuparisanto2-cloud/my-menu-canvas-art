import { IMAGE_WIDTH, IMAGE_HEIGHT, type MenuPage } from "@/data/menu-pages";

function absolute(url: string) {
  if (typeof window === "undefined") return url;
  if (/^(https?:|images\/)/.test(url)) return url;
  return new URL(url, window.location.origin).href;
}

const WA_SVG =
  '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.92-4.45 9.92-9.93C21.96 6.45 17.5 2 12.04 2Zm0 18.02a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.25-4.35c0-4.54 3.7-8.23 8.24-8.23a8.24 8.24 0 0 1 0 16.44Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.09-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.22.25-.85.84-.85 2.04s.87 2.37 1 2.53c.12.17 1.71 2.61 4.14 3.66.58.25 1.03.4 1.38.51.58.19 1.11.16 1.53.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z"/></svg>';

export function buildMenuHtml(pages: MenuPage[]) {
  const items = pages
    .map(
      (p, i) => `    <figure id="${p.id}" data-i="${i}" style="transition-delay:${Math.min(i, 3) * 50}ms">
      <img src="${absolute(p.url)}" alt="${p.title} — ${p.subtitle}" width="${IMAGE_WIDTH}" height="${IMAGE_HEIGHT}" ${i === 0 ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"'} />
      <button class="wa${i === 0 ? " first" : ""}" type="button" data-i="${i}" aria-label="Bagikan ${p.title} via WhatsApp">${WA_SVG}</button>
      <button class="fav" type="button" data-id="${p.id}" aria-label="Tandai favorit ${p.title}">★</button>
    </figure>`,
    )
    .join("\n");

  const data = JSON.stringify(
    pages.map((p) => ({
      id: p.id,
      url: absolute(p.url),
      title: p.title,
      alt: `${p.title} — ${p.subtitle}`,
    })),
  );

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>Menu Kantin Inyong — Umaeh Inyong Purwokerto</title>
<style>
  :root { color-scheme: light; }
  * { -webkit-tap-highlight-color: transparent; }
  body { margin:0; background:#faf5ea; font-family: system-ui, -apple-system, sans-serif; }
  main { display:flex; flex-direction:column; gap:12px; padding:12px; max-width:720px; margin:0 auto; }
  figure { position:relative; margin:0; opacity:0; transform:translate3d(0,18px,0) scale(.985);
           transition:opacity .6s cubic-bezier(.22,.61,.36,1), transform .6s cubic-bezier(.22,.61,.36,1);
           will-change:transform,opacity; contain:content; }
  figure.in { opacity:1; transform:none; }
  img { width:100%; height:auto; display:block; border-radius:14px; aspect-ratio:${IMAGE_WIDTH}/${IMAGE_HEIGHT}; cursor:zoom-in; }
  .fav { position:absolute; right:12px; top:12px; border:0; border-radius:999px; padding:8px 11px;
         background:rgba(0,0,0,.38); color:#fff; font-size:16px; line-height:1; backdrop-filter:blur(4px); }
  .fav.on { color:#e8a021; }
  .wa { position:absolute; left:12px; top:12px; border:0; border-radius:999px; padding:8px;
        background:#25D366; color:#fff; line-height:0; box-shadow:0 2px 6px rgba(0,0,0,.25); }
  .wa svg { display:block; }
  #lbwa { background:#25D366; color:#fff; border:0; border-radius:999px; padding:8px; line-height:0; }
  #lb { position:fixed; inset:0; background:rgba(0,0,0,.96); display:none; flex-direction:column; z-index:60; }
  #lb.open { display:flex; animation:fade .2s ease; }
  @keyframes fade { from{opacity:0} to{opacity:1} }
  #lbbar { display:flex; align-items:center; justify-content:space-between; color:#fff; padding:12px; font-size:13px; }
  #lbbar button { background:rgba(255,255,255,.12); border:0; color:#fff; border-radius:999px; padding:8px 12px; font-size:15px; }
  #lbstage { flex:1; overflow:hidden; touch-action:none; position:relative; }
  #lbwrap { height:100%; width:100%; display:flex; align-items:center; justify-content:center;
            transform-origin:0 0; will-change:transform; }
  #lbimg { max-width:100%; max-height:100%; width:auto; height:auto; border-radius:8px; cursor:auto;
           animation:pop .3s cubic-bezier(.22,.61,.36,1); }
  @keyframes pop { from{opacity:0; transform:scale(.96)} to{opacity:1; transform:none} }
  #lbhint { color:rgba(255,255,255,.6); font-size:11px; text-align:center; padding:8px 12px 20px; }
  @media (prefers-reduced-motion: reduce){ figure{opacity:1;transform:none;transition:none} #lbimg,#lb{animation:none} }
</style>
</head>
<body>
<main>
${items}
</main>

<div id="lb" role="dialog" aria-modal="true">
  <div id="lbbar">
    <button id="lbclose" aria-label="Tutup">✕</button>
    <span id="lbcount"></span>
    <span style="display:flex;gap:8px;align-items:center">
      <button id="lbwa" aria-label="Bagikan via WhatsApp">${WA_SVG}</button>
      <button id="lbfav" aria-label="Favorit">★</button>
    </span>
  </div>
  <div id="lbstage"><div id="lbwrap"><img id="lbimg" alt="" /></div></div>
  <div id="lbhint">Ketuk dua kali untuk memperbesar · geser untuk pindah halaman</div>
</div>

<script>
(function(){
  var PAGES = ${data};
  var KEY='inyong-fav-v1', TTL=3600000;
  function readFav(){ try{ var m=JSON.parse(localStorage.getItem(KEY)||'{}')||{}, n={}, t=Date.now();
    for(var k in m){ if(t-m[k]<TTL) n[k]=m[k]; } return n; }catch(e){ return {}; } }
  function writeFav(m){ try{ localStorage.setItem(KEY, JSON.stringify(m)); }catch(e){} }
  var fav = readFav();
  function paint(){
    document.querySelectorAll('.fav').forEach(function(b){ b.classList.toggle('on', !!fav[b.dataset.id]); });
    var p = PAGES[cur]; if(p) lbfav.classList.toggle('on', !!fav[p.id]);
  }
  function toggle(id){ fav=readFav(); if(fav[id]) delete fav[id]; else fav[id]=Date.now(); writeFav(fav); paint(); }
  document.querySelectorAll('.fav').forEach(function(b){
    b.addEventListener('click', function(e){ e.stopPropagation(); toggle(b.dataset.id); });
  });
  setInterval(function(){ fav=readFav(); paint(); }, 60000);

  var figs = document.querySelectorAll('figure');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
    }, { rootMargin: '120px' });
    figs.forEach(function(el){ io.observe(el); });
  } else { figs.forEach(function(el){ el.classList.add('in'); }); }

  var lb=document.getElementById('lb'), lbimg=document.getElementById('lbimg'),
      lbwrap=document.getElementById('lbwrap'), lbstage=document.getElementById('lbstage'),
      lbcount=document.getElementById('lbcount'), lbfav=document.getElementById('lbfav');
  var cur=0, t={s:1,x:0,y:0}, drag=0, anim=true, pts={}, n=0, g=null, lastTap=0;

  function apply(){
    lbwrap.style.transition = anim ? 'transform .28s cubic-bezier(.22,.61,.36,1)' : 'none';
    lbwrap.style.transform = 'translate3d('+(t.x+drag)+'px,'+t.y+'px,0) scale('+t.s+')';
  }
  function show(i){
    cur=i; t={s:1,x:0,y:0}; drag=0; anim=true;
    lbimg.src=PAGES[i].url; lbimg.alt=PAGES[i].alt;
    lbimg.style.animation='none'; void lbimg.offsetWidth; lbimg.style.animation='';
    lbcount.textContent=(i+1)+' / '+PAGES.length; apply(); paint();
  }
  function open(i){ lb.classList.add('open'); document.body.style.overflow='hidden'; show(i);
    try{ history.pushState({lb:1},''); }catch(e){} }
  function close(){ lb.classList.remove('open'); document.body.style.overflow='';
    if(history.state && history.state.lb) history.back(); }
  window.addEventListener('popstate', function(){ if(lb.classList.contains('open')){ lb.classList.remove('open'); document.body.style.overflow=''; } });

  document.querySelectorAll('figure img').forEach(function(img, i){
    img.addEventListener('click', function(){ open(i); });
  });
  document.getElementById('lbclose').addEventListener('click', close);
  lbfav.addEventListener('click', function(){ toggle(PAGES[cur].id); });

  var pre={};
  function pl(u){ if(!u||pre[u]) return; pre[u]=1; var im=new Image(); im.decoding='async'; im.fetchPriority='low'; im.src=u; }
  function idle(fn){ (window.requestIdleCallback||function(f){setTimeout(f,200);})(fn,{timeout:1200}); }
  function chain(list){ var q=list.slice(); (function step(){ var u=q.shift(); if(!u) return; var im=new Image(); im.decoding='async'; im.fetchPriority='low'; im.onload=im.onerror=function(){ idle(step); }; pre[u]=1; im.src=u; })(); }
  window.addEventListener('load', function(){ idle(function(){ chain(PAGES.slice(1).map(function(p){return p.url;}).filter(function(u){return !pre[u];})); }); });

  function share(i){
    var p=PAGES[i];
    function wa(){ window.open('https://wa.me/?text='+encodeURIComponent(p.alt+'\\n'+p.url),'_blank'); }
    if(navigator.share && navigator.canShare){
      fetch(p.url).then(function(r){ return r.blob(); }).then(function(b){
        var f=new File([b], p.id+'.webp', {type:b.type||'image/webp'});
        if(navigator.canShare({files:[f]})) return navigator.share({files:[f], title:p.title, text:p.alt});
        wa();
      }).catch(function(e){ if(!e || e.name!=='AbortError') wa(); });
    } else wa();
  }
  document.querySelectorAll('.wa').forEach(function(b){
    b.addEventListener('click', function(e){ e.stopPropagation(); share(+b.dataset.i); });
  });
  document.getElementById('lbwa').addEventListener('click', function(){ share(cur); });
  document.addEventListener('keydown', function(e){
    if(!lb.classList.contains('open')) return;
    if(e.key==='Escape') close();
    if(e.key==='ArrowRight' && cur<PAGES.length-1) show(cur+1);
    if(e.key==='ArrowLeft' && cur>0) show(cur-1);
  });

  function mid(){ var a=[],k; for(k in pts) a.push(pts[k]); return a; }
  lbstage.addEventListener('pointerdown', function(e){
    pts[e.pointerId]={x:e.clientX,y:e.clientY}; n++; anim=false;
    var r=lbstage.getBoundingClientRect(), a=mid();
    if(n===2){ g={d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)||1,s:t.s,x:t.x,y:t.y,
      mx:(a[0].x+a[1].x)/2,my:(a[0].y+a[1].y)/2,ox:(a[0].x+a[1].x)/2-r.left,oy:(a[0].y+a[1].y)/2-r.top}; }
    else if(n===1){ g={d:0,s:t.s,x:t.x,y:t.y,mx:e.clientX,my:e.clientY,ox:0,oy:0}; }
  });
  lbstage.addEventListener('pointermove', function(e){
    if(!pts[e.pointerId]||!g) return;
    pts[e.pointerId]={x:e.clientX,y:e.clientY};
    var a=mid();
    if(n>=2 && g.d){
      var d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)||1;
      var k=Math.min(4,Math.max(1,(d/g.d)*g.s))/g.s;
      t={s:g.s*k, x:g.ox-(g.ox-g.x)*k, y:g.oy-(g.oy-g.y)*k}; apply(); return;
    }
    var dx=e.clientX-g.mx, dy=e.clientY-g.my;
    if(t.s>1.01){ t={s:g.s,x:g.x+dx,y:g.y+dy}; apply(); }
    else if(Math.abs(dx)>Math.abs(dy)){ drag=dx; apply(); }
  });
  function end(e){
    delete pts[e.pointerId]; n=Math.max(0,n-1);
    if(n>0) return;
    g=null; anim=true;
    var moved=Math.abs(drag)>8;
    if(t.s<=1.01){
      if(drag<-60 && cur<PAGES.length-1){ drag=0; show(cur+1); return; }
      if(drag>60 && cur>0){ drag=0; show(cur-1); return; }
      drag=0;
    }
    apply();
    if(moved) return;
    var now=Date.now();
    if(now-lastTap<300){
      lastTap=0;
      var r=lbstage.getBoundingClientRect(), px=e.clientX-r.left, py=e.clientY-r.top;
      if(t.s>1.01){ t={s:1,x:0,y:0}; }
      else { var k=2.5; t={s:k,x:px-(px-t.x)*k,y:py-(py-t.y)*k}; }
      apply();
    } else { lastTap=now; }
  }
  lbstage.addEventListener('pointerup', end);
  lbstage.addEventListener('pointercancel', end);
})();
</script>
</body>
</html>`;
}

export function downloadMenuHtml(pages: MenuPage[]) {
  const blob = new Blob([buildMenuHtml(pages)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "menu-kantin-inyong.html";
  a.click();
  URL.revokeObjectURL(url);
}
